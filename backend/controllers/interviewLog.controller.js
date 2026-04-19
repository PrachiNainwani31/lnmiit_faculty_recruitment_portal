// controllers/interviewLog.controller.js
const {
  InterviewLog, RecruitmentCycle, CandidateStats,
  Candidate, Expert, SelectedCandidate, User,
  CandidateApplication, CandidateExperience,
} = require("../models");
const getCurrentCycle = require("../utils/getCurrentCycle");
const safeDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  // Use local date parts to avoid UTC timezone shift (IST = UTC+5:30)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};
/* ════════════════════════════════════════════════════════
   HELPER: build candidateExperiences array for one HOD
   - Fetches selected + waitlisted candidates
   - For each, finds their CandidateApplication → CandidateExperience rows
   - Merges with any DOFA-edited toDate already saved in the log
════════════════════════════════════════════════════════ */
async function buildCandidateExperiences(hodId,cycleString ,savedExperiences = []) {
  // Build a lookup of previously saved editedToDate values
  // keyed by `${candidateId}__${expIndex}`
  const savedMap = {};
  (savedExperiences || []).forEach(sc => {
    (sc.experiences || []).forEach((exp, i) => {
      const key = `${sc.candidateId}__${i}`;
      savedMap[key] = exp.editedToDate || null;
    });
  });

  const selected = await SelectedCandidate.findAll({
    where:   { cycle: cycleString, hodId, status: ["SELECTED","WAITLISTED"] },
    include: [{ model: Candidate, as: "candidate" }],
  });

  const result = [];

  for (const sc of selected) {
    const cand = sc.candidate;
    if (!cand) continue;

    // Find their CandidateApplication via userId
    const app = await CandidateApplication.findOne({
      where:   { candidateUserId: cand.userId },
      include: [{ model: CandidateExperience, as: "experiences", required: false }],
    });

    const rawExps = app?.experiences || [];

    // Group: Research, Teaching, Industry
   const experiences = rawExps.map((e, i) => {
    const key = `${cand.id}__${i}`;
    return {
      type:         e.type         || "Other",
      organization: e.organization || "",
      designation:  e.designation  || "",
      fromDate:     safeDate(e.fromDate),   // ← was e.fromDate.toString().slice(0,10)
      toDate:       safeDate(e.toDate),     // ← was e.toDate.toString().slice(0,10)
      natureOfWork: e.natureOfWork || "",
      editedToDate: savedMap[key] !== undefined ? savedMap[key] : null,
    };
  });

    result.push({
      candidateId:   cand.id,
      candidateName: cand.fullName || cand.email || `Candidate ${cand.id}`,
      status:        sc.status,
      designation:   sc.designation || "",
      experiences,
    });
  }

  return result;
}

/* ════════════════════════════════════════════════════════
   HELPER: prefill non-experience fields for one HOD
════════════════════════════════════════════════════════ */
async function getPrefill(hodId,cycleString) {
  const [cycle, stats, appearedCount, experts, selected] = await Promise.all([
    RecruitmentCycle.findOne({ where: { hodId, cycle: cycleString } }),
    CandidateStats.findOne({ where: { cycle: cycleString, hodId } }),
    Candidate.count({ where: { cycle: cycleString, hodId, appearedInInterview: true } }),
    Expert.findAll({ where: { cycle: cycleString, uploadedById: hodId }, limit: 3, order: [["id","ASC"]] }),
    SelectedCandidate.findAll({
      where:   { cycle: cycleString, hodId },
      include: [{ model: Candidate, as: "candidate" }],
    }),
  ]);

  const selectedNames   = selected.filter(s => s.status === "SELECTED").map(s => s.candidate?.fullName || "").join(", ");
  const waitlistedNames = selected.filter(s => s.status === "WAITLISTED").map(s => s.candidate?.fullName || "").join(", ");

  const hod = await User.findByPk(hodId, { attributes: ["department"] });

  return {
    hodId,
    interviewDate:           cycle?.interviewDate      || null,
    department:              hod?.department            || "",
    noOfApplications:        stats?.totalApplications  || 0,
    noOfIlscShortlisted: stats?.ilscShortlisted     || 0,
    noOfDlscShortlisted: stats?.dlscShortlisted     || 0,
    noForTeachingPresentation:appearedCount??0,
    noShortlistedForInterview: appearedCount?? 0,
    noForPersonalInterview:  appearedCount??0,
    expert1Name:   experts[0]?.fullName    || "",
    expert1Detail: experts[0] ? `${experts[0].designation}, ${experts[0].institute}` : "",
    expert2Name:   experts[1]?.fullName    || "",
    expert2Detail: experts[1] ? `${experts[1].designation}, ${experts[1].institute}` : "",
    expert3Name:   experts[2]?.fullName    || "",
    expert3Detail: experts[2] ? `${experts[2].designation}, ${experts[2].institute}` : "",
    selectedCandidateName:   selectedNames,
    waitlistedCandidateName: waitlistedNames,
  };
}

/* ════════════════════════════════════
   GET ALL LOGS
════════════════════════════════════ */
exports.getLogs = async (req, res) => {
  try {
    const cycles = await RecruitmentCycle.findAll({
      order: [["createdAt", "DESC"]],
      include: [{ model: User, as: "hod", attributes: ["id","department","name","email"] }],
    });

    const logs = await InterviewLog.findAll();
    const logMap = {};
    logs.forEach(l => { logMap[`${l.hodId}__${l.cycle}`] = l.toJSON(); });

    const result = [];
    for (const rc of cycles) {
      if (!rc.hodId) continue;

      const saved   = logMap[`${rc.hodId}__${rc.cycle}`] || {};
      const prefill = await getPrefill(rc.hodId, rc.cycle);

      // Build candidateExperiences: prefill from DB, merge with any saved editedToDate
      const candidateExperiences = await buildCandidateExperiences(
        rc.hodId,rc.cycle,
        saved.candidateExperiences || []
      );

      result.push({
        ...prefill,
        ...saved,
        cycleLabel:rc.cycle,
        // Always use fresh prefill for read-only portal data
        interviewDate:           prefill.interviewDate,
        noOfApplications:        saved.noOfApplications        ?? prefill.noOfApplications??0,
        noOfIlscShortlisted: saved.noOfIlscShortlisted ?? prefill.noOfIlscShortlisted??0,
        noOfDlscShortlisted: saved.noOfDlscShortlisted ?? prefill.noOfDlscShortlisted??0,
        noForTeachingPresentation: saved.noForTeachingPresentation ?? prefill.noForTeachingPresentation??0,
        noShortlistedForInterview: saved.noShortlistedForInterview ?? prefill.noShortlistedForInterview??0,
        noForPersonalInterview:  saved.noForPersonalInterview  ?? prefill.noForPersonalInterview??0,
        selectedCandidateName:   saved.selectedCandidateName   ?? prefill.selectedCandidateName,
        waitlistedCandidateName: saved.waitlistedCandidateName ?? prefill.waitlistedCandidateName,
        expert1Name:   saved.expert1Name   || prefill.expert1Name,
        expert1Detail: saved.expert1Detail || prefill.expert1Detail,
        expert2Name:   saved.expert2Name   || prefill.expert2Name,
        expert2Detail: saved.expert2Detail || prefill.expert2Detail,
        expert3Name:   saved.expert3Name   || prefill.expert3Name,
        expert3Detail: saved.expert3Detail || prefill.expert3Detail,
        // Always fresh experience data with saved editedToDate merged in
        candidateExperiences,
        isSaved: !!logMap[`${rc.hodId}__${rc.cycle}`],
      });
    }

    res.json(result);
  } catch (err) {
    console.error("getLogs:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ════════════════════════════════════
   SAVE / UPSERT LOG
   Frontend sends the full row including
   candidateExperiences with editedToDate values
════════════════════════════════════ */
exports.saveLog = async (req, res) => {
  try {
    const body = req.body;
    const { hodId, cycleLabel } = body;
    if (!hodId) return res.status(400).json({ message: "hodId required" });
    if (!cycleLabel) return res.status(400).json({ message: "cycle required" });
    // Persist only the fields the model knows about
    const savePayload = {
      cycle:                     cycleLabel,
      hodId,
      interviewDate:             body.interviewDate             || null,
      department:                body.department                || null,
      forThePostOf:              body.forThePostOf              || null,
      noOfApplications:          body.noOfApplications          ?? null,
      noOfIlscShortlisted:   body.noOfIlscShortlisted   ?? null,
      noOfDlscShortlisted:   body.noOfDlscShortlisted   ?? null,
      noForTeachingPresentation: body.noForTeachingPresentation ?? null,
      noShortlistedForInterview: body.noShortlistedForInterview ?? null,
      noForPersonalInterview:    body.noForPersonalInterview    ?? null,
      expertCount: body.expertCount ?? 2,
      expert1Name:               body.expert1Name               || null,
      expert1Detail:             body.expert1Detail             || null,
      expert2Name:               body.expert2Name               || null,
      expert2Detail:             body.expert2Detail             || null,
      expert3Name:               body.expert3Name               || null,
      expert3Detail:             body.expert3Detail             || null,
      selectedCandidateName:     body.selectedCandidateName     || null,
      waitlistedCandidateName:   body.waitlistedCandidateName   || null,
      // Store the full candidateExperiences (with editedToDate from DOFA)
      candidateExperiences:      body.candidateExperiences      || [],
      evaluationSheetLink:       body.evaluationSheetLink       || null,
      advCopyDate:               body.advCopyDate               || null,
      advCopyLink:               body.advCopyLink               || null,
      committeeLink:             body.committeeLink             || null,
      remark:                    body.remark                    || null,
    };

    await InterviewLog.upsert(savePayload);
    res.json({ success: true });
  } catch (err) {
    console.error("saveLog:", err);
    res.status(500).json({ message: "Failed to save log" });
  }
};

/* ════════════════════════════════════
   EXPORT — flat rows for Excel
════════════════════════════════════ */
// interviewLog.controller.js — replace exportLogs
exports.exportLogs = async (req, res) => {
  try {
    const cycles = await RecruitmentCycle.findAll({ order: [["createdAt", "DESC"]] });
    const logs   = await InterviewLog.findAll();
    const logMap = {};
    logs.forEach(l => { logMap[`${l.hodId}__${l.cycle}`] = l.toJSON(); });

    const rows = [];

    for (const rc of cycles) {
      if (!rc.hodId) continue;
      const prefill = await getPrefill(rc.hodId, rc.cycle);
      const saved   = logMap[`${rc.hodId}__${rc.cycle}`] || {};
      const merged  = { ...prefill, ...saved };

      const candidates = merged.candidateExperiences || [];

      // One row per candidate (or one blank row if no candidates)
      const candRows = candidates.length > 0 ? candidates : [null];

      candRows.forEach(cand => {
        const expParts = [];
        (cand?.experiences || []).forEach(e => {
          const to = e.editedToDate || e.toDate || "?";
          expParts.push(`${e.type}: ${e.fromDate || "?"} → ${to} (${e.organization || "—"})`);
        });

        rows.push({
          "Date of Faculty Interview":      merged.interviewDate || "",
          "Department":                     merged.department    || "",
          "Candidate Name":                 cand?.candidateName  || "-No candidate selected-",
          "Selection Status":               cand?.status         || "",
          "For the Post of":                cand?.designation    || merged.forThePostOf || "",
          "Total Applications":             merged.noOfApplications ?? 0,
          "ILSC Shortlisted":               merged.noOfIlscShortlisted ?? 0,
          "DLSC Shortlisted":               merged.noOfDlscShortlisted ?? 0,
          "Present for Teaching":           merged.noForTeachingPresentation ?? 0,
          "Shortlisted for Interview":      merged.noShortlistedForInterview ?? 0,
          "Present for Personal Interview": merged.noForPersonalInterview ?? 0,
          "Expert 1 Name":                  merged.expert1Name   || "",
          "Expert 1 Detail":                merged.expert1Detail || "",
          "Expert 2 Name":                  merged.expert2Name   || "",
          "Expert 2 Detail":                merged.expert2Detail || "",
          // Only include expert3 if actually filled
          ...((merged.expertCount >= 3 && merged.expert3Name) ? {
            "Expert 3 Name":   merged.expert3Name   || "",
            "Expert 3 Detail": merged.expert3Detail || "",
          } : {}),
          "Experience Details":             expParts.join(" | ") || "",
          "Evaluation Sheet":               merged.evaluationSheetLink || "",
          "Adv. Copy Date":                 merged.advCopyDate   || "",
          "Adv. Copy Link":                 merged.advCopyLink   || "",
          "Committee Link":                 merged.committeeLink || "",
          "Remark":                         merged.remark        || "",
        });
      });
    }

    res.json(rows);
  } catch (err) {
    console.error("exportLogs:", err);
    res.status(500).json({ message: "Export failed" });
  }
};