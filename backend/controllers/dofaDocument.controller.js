const archiver = require("archiver");
const fs       = require("fs");
const path     = require("path");
const { CandidateApplication, CandidateReferee, CandidateExperience, User } = require("../models");
const { sendEmail }            = require("../utils/emailSender");
const { createNotification }   = require("../utils/notify");
const { log } = require("../utils/activityLogger");
const { Op } = require("sequelize");
const templates = require("../utils/emailTemplates");
const getCurrentCycle = require("../utils/getCurrentCycle");

const SINGLE_DOC_COLS = [
  "docCv","docTeachingStatement","docResearchStatement",
  "docMarks10","docMarks12","docGraduation","docPostGraduation",
  "docPhdCourseWork","docPhdProvisional","docPhdDegree","docThesisSubmission",
];
const MULTI_DOC_COLS = [
  "docResearchExpCerts","docTeachingExpCerts","docIndustryExpCerts",
  "docBestPapers","docPostDocDocs","docSalarySlips","docOtherDocs",
];
const DOC_LABELS = {
  docCv:"CV", docTeachingStatement:"Teaching_Statement",
  docResearchStatement:"Research_Statement", docMarks10:"10th_Marksheet",
  docMarks12:"12th_Marksheet", docGraduation:"Graduation_Cert",
  docPostGraduation:"PostGraduation_Cert", docPhdCourseWork:"PhD_CourseWork",
  docPhdProvisional:"PhD_Provisional", docPhdDegree:"PhD_Degree",docThesisSubmission: "Thesis_Submission_Certificate",
  docResearchExpCerts:"Research_Exp", docTeachingExpCerts:"Teaching_Exp",
  docIndustryExpCerts:"Industry_Exp", docBestPapers:"Best_Papers",
  docPostDocDocs:"PostDoc", docSalarySlips:"Salary_Slips", docOtherDocs:"Other",
};

/* ── Shared ZIP builder ── */
async function streamDocsAsZip(app, res) {
  const candidateName = (app.name || `candidate_${app.id}`)
    .replace(/[^a-zA-Z0-9_ -]/g, "_").replace(/\s+/g, "_");

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${candidateName}_Documents.zip"`);

  const archive = archiver("zip", { zlib: { level: 6 } });
  archive.on("error", () => { if (!res.headersSent) res.status(500).end(); });
  archive.pipe(res);

  let fileCount = 0;

  for (const col of SINGLE_DOC_COLS) {
    const fp = app[col];
    if (!fp) continue;
    const abs = path.resolve(fp);
    if (!fs.existsSync(abs)) continue;
    archive.file(abs, { name: `${DOC_LABELS[col] || col}${path.extname(fp) || ".pdf"}` });
    fileCount++;
  }

  for (const col of MULTI_DOC_COLS) {
    const files = app[col];
    if (!Array.isArray(files) || !files.length) continue;
    const label = DOC_LABELS[col] || col;
    files.forEach((f, i) => {
      const fp = typeof f === "string" ? f : f?.path;
      if (!fp) return;
      const abs = path.resolve(fp);
      if (!fs.existsSync(abs)) return;
      const name = (typeof f === "object" && f.name) ? f.name : `file_${i+1}${path.extname(fp)||".pdf"}`;
      archive.file(abs, { name: `${label}/${name}` });
      fileCount++;
    });
  }

  if (fileCount === 0) archive.append("No documents uploaded yet.", { name: "README.txt" });
  await archive.finalize();
}

exports.getDocumentTracking = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { RecruitmentCycle, Candidate, User } = require("../models");

    const activeCycles = await RecruitmentCycle.findAll({
      where: { [Op.or]: [{ isClosed: false }, { isClosed: null },{isClosed:0}] },
      order: [["createdAt", "DESC"]],
    });
    const activeCycleStrings = activeCycles.map(c => c.cycle);
    const activeHodIds = [...new Set(activeCycles.map(c => c.hodId).filter(Boolean))];
    if (!activeHodIds.length) return res.json([]);

    const activeCandidates = await Candidate.findAll({
  where: { cycle: activeCycleStrings, hodId: activeHodIds }, // ← scope to active HoDs
  attributes: ["email", "hodId"],
});

// Map email → hodId so we can check if HoD is active
const emailToHodId = {};
activeCandidates.forEach(c => { if (c.email) emailToHodId[c.email] = c.hodId; });
const candidateEmails = Object.keys(emailToHodId);

const applications = await CandidateApplication.findAll({
  where: {
    status: { [Op.in]: ["SUBMITTED", "QUERY"] },
    ...(candidateEmails.length ? { email: { [Op.in]: candidateEmails } } : { id: -1 }),
  },
  include: [
    { model: CandidateReferee,    as: "referees",    required: false },
    { model: CandidateExperience, as: "experiences", required: false },
  ],
});

// ── FIX: only keep applications whose HoD's cycle is NOT closed ──
const filteredApplications = applications.filter(app => {
  const hodId = emailToHodId[app.email];
  if (!hodId) return false;
  const hodCycle = activeCycles.find(c => c.hodId === hodId);
  if (!hodCycle) return false;

  // ── KEY FIX: if the application was submitted BEFORE this active cycle
  //    was created, it belongs to a previous (now closed) cycle — exclude it.
  if (new Date(app.createdAt) < new Date(hodCycle.createdAt)) return false;
  return true;
});
    // ← rest is exactly your existing deptMap building code, unchanged:
    const deptMap = {};
    filteredApplications
      .filter(app => app.name || app.email)
      .forEach(app => {
        const dept = app.department || "General";
        if (!deptMap[dept]) {
          const hodId = emailToHodId[app.email];
          const hodCycle = activeCycles.find(c => c.hodId === hodId);
          deptMap[dept] = {
            department: dept,
            cycle: hodCycle?.cycle || null,     // e.g. "2024-25 Cycle 2"
            candidates: [],
          };
        }
        const clean = (p) => {
          if (!p) return null;
          if (typeof p === "string") return p.replace(/^\.\//, "");
          if (typeof p === "object") {
            const filePath = p.path || p.file || null;
            return filePath ? filePath.replace(/^\.\//, "") : null;
          }
          return null;
        };

        const documents = {
          cv:                clean(app.docCv),
          teachingStatement: clean(app.docTeachingStatement),
          researchStatement: clean(app.docResearchStatement),
          marks10:           clean(app.docMarks10),
          marks12:           clean(app.docMarks12),
          graduation:        clean(app.docGraduation),
          postGraduation:    clean(app.docPostGraduation),
          phdCourseWork:     clean(app.docPhdCourseWork),
          phdProvisional:    clean(app.docPhdProvisional),
          phdDegree:         clean(app.docPhdDegree),
          thesisSubmission:    clean(app.docThesisSubmission),
          dateOfDefense:     app.docDateOfDefense || null,
          researchExpCerts: Array.isArray(app.docResearchExpCerts) ? app.docResearchExpCerts.map(clean).filter(Boolean) : [],
          teachingExpCerts: Array.isArray(app.docTeachingExpCerts) ? app.docTeachingExpCerts.map(clean).filter(Boolean) : [],
          industryExpCerts: Array.isArray(app.docIndustryExpCerts) ? app.docIndustryExpCerts.map(clean).filter(Boolean) : [],
          bestPapers:   Array.isArray(app.docBestPapers)   ? app.docBestPapers.map(clean).filter(Boolean)   : [],
          postDocDocs:  Array.isArray(app.docPostDocDocs)  ? app.docPostDocDocs.map(clean).filter(Boolean)  : [],
          salarySlips:  Array.isArray(app.docSalarySlips)  ? app.docSalarySlips.map(clean).filter(Boolean)  : [],
          otherDocs: Array.isArray(app.docOtherDocs)
            ? app.docOtherDocs.map(item => {
                if (!item) return null;
                if (typeof item === "string") return { file: clean(item) };
                return { name: item.name || null, file: clean(item.file || item.path || null) };
              }).filter(item => item && item.file)
            : [],
        };

        deptMap[dept].candidates.push({
          id:            app.id,
          name:          app.name       || "—",
          email:         app.email      || "—",
          phone:         app.phone      || "—",
          status:        app.status     || "DRAFT",   // ✅ will show QUERY when applicable
          acceptance:    app.acceptance,
          accommodation: app.accommodation,
          submittedAt:   app.updatedAt || null,
          documents,
          verdicts:      app.verdicts     || {},
          publications:  app.publications || [],
          referees: (app.referees || []).map(r => ({
            id: r.id, salutation: r.salutation, name: r.name, designation: r.designation,
            department: r.department, institute: r.institute, email: r.email,
            status: r.status, submittedAt: r.submittedAt, letter: r.letter,
          })),
          experiences: (app.experiences || []).map(e => ({
            id: e.id, type: e.type, organization: e.organization, designation: e.designation,
            department: e.department, fromDate: e.fromDate, toDate: e.toDate,
            natureOfWork: e.natureOfWork, certificate: e.certificate,
          })),
        });
      });

    res.json(Object.values(deptMap));
  } catch (err) {
    console.error("FULL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateDocumentVerdict = async (req, res) => {
  try {
    const { appId, doc, status, remark } = req.body;
    const app = await CandidateApplication.findByPk(appId);
    if (!app) return res.status(404).json({ message: "Application not found" });

    const verdicts = app.verdicts || {};
    verdicts[doc]  = { status, remark };
    await CandidateApplication.update({ verdicts }, { where: { id: appId } });
    await log({
      user:        req.user,
      action:      "DOCUMENT_VERDICT_UPDATED",
      entity:      "CandidateApplication",
      entityId:    app.id,
      description: `Document verdict updated for candidate ${app.candidateUserId}`,
      req,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("updateDocumentVerdict error:", err.message);
    res.status(500).json({ message: "Failed to update verdict" });
  }
};

/* ── Send reminder — also sets application to QUERY so candidate can re-edit ── */
exports.sendReminder = async (req, res) => {
  try {
    const { candidateId,emailBody } = req.body;
    const app = await CandidateApplication.findByPk(candidateId);
    if (!app)    return res.status(404).json({ message: "Application not found" });
    if (!app.email) return res.status(400).json({ message: "Candidate email not found" });

      // In sendReminder — replace the sendEmail call:
      let subject, html;
      if (emailBody) {
        subject = "Action Required — Document Submission / Correction | LNMIIT";
        html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;white-space:pre-wrap">${emailBody}</div>`;
      } else {
      const tmpl = templates.documentRemarkToCandidate({
        candidateName: app.name,
        issues: Object.entries(app.verdicts || {})
          .filter(([, val]) => val?.status === "Incorrect" || val?.status === "Missing")
          .map(([doc, val]) => ({ doc, status: val.status, remark: val.remark })),
      });
      subject = tmpl.subject;
      html = tmpl.html;
    }
      await sendEmail(app.email,subject,html);

    // NEW: set application status to QUERY so candidate can re-edit
    await CandidateApplication.update({ status: "QUERY" }, { where: { id: candidateId } });

    // NEW: create a targeted notification for the candidate (by their userId)
    await createNotification({
      cycle:        "SYSTEM",
      role:         "CANDIDATE",
      title:        "Document Correction Required",
      message:      `DoFA has flagged document issue(s) in your application. Please review and resubmit.`,
      type:         "COMMENT",
      targetUserId: app.candidateUserId,   // target this candidate specifically
    });

    await log({
      user:        req.user,
      action:      "DOCUMENT_REMINDER_SENT",
      entity:      "CandidateApplication",
      entityId:    app.id,
      description: `Reminder sent to candidate ${app.email}`,req,
    });
    res.json({ success: true, message: `Reminder sent to ${app.email}` });
  } catch (err) {
    console.error("sendReminder error:", err.message);
    res.status(500).json({ error: "Failed to send reminder" });
  }
};

exports.downloadCandidateDocs = async (req, res) => {
  try {
    const app = await CandidateApplication.findByPk(req.params.appId);
    if (!app) return res.status(404).json({ message: "Application not found" });
    await streamDocsAsZip(app, res);
  } catch (err) {
    console.error("downloadCandidateDocs:", err);
    if (!res.headersSent) res.status(500).json({ message: "Download failed" });
  }
};

exports.downloadByCandidate = async (req, res) => {
  try {
    const { Candidate } = require("../models");
    const candidate = await Candidate.findByPk(req.params.candidateId);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    const app = await CandidateApplication.findOne({
      where: { candidateUserId: candidate.userId },
    });
    if (!app) return res.status(404).json({ message: "No application found for this candidate" });

    await streamDocsAsZip(app, res);
  } catch (err) {
    console.error("downloadByCandidate:", err);
    if (!res.headersSent) res.status(500).json({ message: "Download failed" });
  }
};

exports.getClosedCycleDocs = async (req, res) => {
  try {
    const { RecruitmentCycle, Candidate } = require("../models");

    /* ── Fetch all CLOSED cycles ── */
    const closedCycles = await RecruitmentCycle.findAll({
      where: { isClosed: true },
      order: [["createdAt", "DESC"]],
    });
    if (!closedCycles.length) return res.json([]);

    const closedCycleStrings = closedCycles.map(c => c.cycle);
    const closedHodIds = [...new Set(closedCycles.map(c => c.hodId).filter(Boolean))];

    /* ── Get candidate emails that belong to closed cycles ── */
    const closedCandidates = await Candidate.findAll({
      where: { cycle: closedCycleStrings, hodId: closedHodIds },
      attributes: ["email", "hodId"],
    });

    const emailToHodId = {};
    closedCandidates.forEach(c => { if (c.email) emailToHodId[c.email] = c.hodId; });
    const candidateEmails = Object.keys(emailToHodId);
    if (!candidateEmails.length) return res.json([]);

    /* ── Fetch their applications ── */
    const applications = await CandidateApplication.findAll({
      where: {
        email: { [Op.in]: candidateEmails },
        status: { [Op.in]: ["SUBMITTED", "QUERY"] },
      },
      include: [
        { model: CandidateReferee,    as: "referees",    required: false },
        { model: CandidateExperience, as: "experiences", required: false },
      ],
    });

    const clean = (p) => {
      if (!p) return null;
      if (typeof p === "string") return p.replace(/^\.\//, "");
      if (typeof p === "object") {
        const fp = p.path || p.file || null;
        return fp ? fp.replace(/^\.\//, "") : null;
      }
      return null;
    };

    /* ── Group by cycle ── */
    const cycleMap = {};
    applications.forEach(app => {
      const hodId    = emailToHodId[app.email];
      const hodCycle = closedCycles.find(c => c.hodId === hodId);
      if (!hodCycle) return;

      const key = hodCycle.cycle;
      if (!cycleMap[key]) {
        cycleMap[key] = {
          cycle:      hodCycle.cycle,
          department: app.department || "General",
          closedAt:   hodCycle.updatedAt || null,
          candidates: [],
        };
      }

      cycleMap[key].candidates.push({
        id:        app.id,
        name:      app.name  || "—",
        email:     app.email || "—",
        phone:     app.phone || "—",
        status:    app.status,
        verdicts:  app.verdicts || {},
        documents: {
          cv:                clean(app.docCv),
          teachingStatement: clean(app.docTeachingStatement),
          researchStatement: clean(app.docResearchStatement),
          marks10:           clean(app.docMarks10),
          marks12:           clean(app.docMarks12),
          graduation:        clean(app.docGraduation),
          postGraduation:    clean(app.docPostGraduation),
          phdCourseWork:     clean(app.docPhdCourseWork),
          phdProvisional:    clean(app.docPhdProvisional),
          phdDegree:         clean(app.docPhdDegree),
          thesisSubmission:  clean(app.docThesisSubmission),
          dateOfDefense:     app.docDateOfDefense || null,
          researchExpCerts:  Array.isArray(app.docResearchExpCerts) ? app.docResearchExpCerts.map(clean).filter(Boolean) : [],
          teachingExpCerts:  Array.isArray(app.docTeachingExpCerts) ? app.docTeachingExpCerts.map(clean).filter(Boolean) : [],
          industryExpCerts:  Array.isArray(app.docIndustryExpCerts) ? app.docIndustryExpCerts.map(clean).filter(Boolean) : [],
          bestPapers:        Array.isArray(app.docBestPapers)        ? app.docBestPapers.map(clean).filter(Boolean)        : [],
          postDocDocs:       Array.isArray(app.docPostDocDocs)       ? app.docPostDocDocs.map(clean).filter(Boolean)       : [],
          salarySlips:       Array.isArray(app.docSalarySlips)       ? app.docSalarySlips.map(clean).filter(Boolean)       : [],
          otherDocs: Array.isArray(app.docOtherDocs)
            ? app.docOtherDocs.map(item => {
                if (!item) return null;
                if (typeof item === "string") return { file: clean(item) };
                return { name: item.name || null, file: clean(item.file || item.path || null) };
              }).filter(i => i && i.file)
            : [],
        },
        referees: (app.referees || []).map(r => ({
          id: r.id, name: r.name, email: r.email,
          designation: r.designation, institute: r.institute,
          status: r.status, letter: r.letter, submittedAt: r.submittedAt,
        })),
      });
    });

    res.json(Object.values(cycleMap));
  } catch (err) {
    console.error("getClosedCycleDocs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};