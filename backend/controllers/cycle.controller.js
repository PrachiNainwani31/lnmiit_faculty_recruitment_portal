// controllers/cycle.controller.js
const { RecruitmentCycle, Expert, Comment, Candidate, User } = require("../models");
const { createNotification } = require("../utils/notify");
const getCurrentCycle = require("../utils/getCurrentCycle");
const templates = require("../utils/emailTemplates");
const { sendEmail } = require("../utils/emailSender");
const { log } = require("../utils/activityLogger");
const { toCode } = require("../utils/deptMap");

/* ════════════════════════════════════
   GET CURRENT CYCLE
════════════════════════════════════ */
exports.getCurrentCycle = async (req, res) => {
  // ✅ Return the most recent non-complete cycle for this HOD
  // If all cycles are complete, return the latest one anyway so HOD can see history
  const cycle = await RecruitmentCycle.findOne({
    where:  { hodId: req.user.id },
    order:  [["createdAt", "DESC"]],
  });
  res.json(cycle || null);
};

/* ════════════════════════════════════
   SUBMIT TO DOFA  (first submission — candidates + experts)
════════════════════════════════════ */
exports.submitToDofa = async (req, res) => {
  try {
    const cycle = await getCurrentCycle(req.user.id);

    if (!cycle) {
      return res.status(404).json({ message: "No active cycle found" });
    }

    const isResubmit = cycle.status === "QUERY";

    await RecruitmentCycle.update(
      { status: "SUBMITTED", isFrozen: true },
      { where: { id: cycle.id } }   // ✅ FIXED (no CYCLE)
    );

    const hod = await User.findByPk(req.user.id);

    const candidateCount = await Candidate.count({
      where: { cycle: cycle.cycle, hodId: req.user.id }, // ✅ FIXED
    });

    const expertCount = await Expert.count({
      where: { cycle: cycle.cycle, uploadedById: req.user.id }, // ✅ FIXED
    });

    const dofaUsers = await User.findAll({ where: { role: "DOFA" } });

    if (isResubmit) {
      const tmpl = templates.hodResubmittedToDofa({
        department: hod?.department,
      });

      for (const u of dofaUsers) {
        await sendEmail(u.email, tmpl.subject, tmpl.html).catch(console.error);
      }

      await createNotification({
        cycle: cycle.cycle,   // ✅ FIXED
        role: "DOFA",
        title: "HOD Resubmitted After Query",
        message: `${hod?.department} HOD has addressed the query and resubmitted.`,
        type: "STATUS",
      });

    } else {
      const tmpl = templates.hodSubmittedToDofa({
        department: hod?.department,
        candidateCount,
        expertCount,
      });

      for (const u of dofaUsers) {
        await sendEmail(u.email, tmpl.subject, tmpl.html).catch(console.error);
      }

      await createNotification({
        cycle: cycle.cycle,   // ✅ FIXED
        role: "DOFA",
        title: "Cycle Submitted",
        message: `${hod?.department} HOD submitted candidate and expert lists.`,
        type: "STATUS",
      });
    }

    await log({
      user: req.user,
      action: "CYCLE_SUBMITTED_TO_DOFA",
      entity: "RecruitmentCycle",
      entityId: cycle.id,
      description: `Cycle submitted to DOFA for department ${hod?.department || req.user.department}`, // ✅ SAFE
      req,
    });

    res.json(cycle);

  } catch (err) {
    console.error("submitToDofa error:", err);
    res.status(500).json({ message: err.message });
  }
};
/* ════════════════════════════════════
   SUBMIT APPEARED CANDIDATES TO DOFA
   Second submission: HOD calls this after marking
   appeared candidates post-interview.
   → Freezes the cycle again.
   → If ALL active HODs have submitted, notifies DOFA.
════════════════════════════════════ */
exports.submitAppearedToDofa = async (req, res) => {
  try {
    const cycle = await getCurrentCycle(req.user.id);
    if (!cycle) return res.status(404).json({ message: "No active cycle found" });
    if (!cycle.interviewDate)
      return res.status(400).json({ message: "Interview date not set." });

    await RecruitmentCycle.update(
      { status: "APPEARED_SUBMITTED", isFrozen: true },
      { where: { id: cycle.id } }
    );

    const hod = await User.findByPk(req.user.id);
    await createNotification({
      cycle:   cycle.cycle,
      role:    "DOFA",
      title:   "Appeared Candidates Submitted",
      message: `HOD (${hod?.department}) has submitted appeared candidate data.`,
      type:    "STATUS",
    });

    const allCycles = await RecruitmentCycle.findAll({
      where: { academicYear: cycle.academicYear },
    });
    const activeCycles   = allCycles.filter(c => ["APPROVED","INTERVIEW_SET","APPEARED_SUBMITTED"].includes(c.status));
    const submittedCount = activeCycles.filter(c => c.status === "APPEARED_SUBMITTED").length;

    if (submittedCount === activeCycles.length && activeCycles.length > 0) {
      await createNotification({
        cycle:   cycle.cycle,
        role:    "DOFA",
        title:   "All Departments Submitted Appeared Data",
        message: `All ${submittedCount} departments submitted appeared data.`,
        type:    "STATUS",
      });
    }

    await log({
      user: req.user, action: "APPEARED_SUBMITTED",
      entity: "RecruitmentCycle", entityId: cycle.id,
      description: `Appeared submitted for ${hod?.department}`, req,
    });

    const updated = await RecruitmentCycle.findByPk(cycle.id);
    res.json({ success: true, cycle: updated });
  } catch (err) {
    console.error("submitAppearedToDofa:", err.message);
    res.status(500).json({ message: "Failed to submit" });
  }
};

/* ════════════════════════════════════
   RAISE QUERY
════════════════════════════════════ */
exports.raiseQuery = async (req, res) => {
  try {
    const { comment, hodId } = req.body;
    if (!comment) return res.status(400).json({ message: "Comment required" });
    const cycle = await getCurrentCycle(hodId);
    if (!cycle) return res.status(404).json({ message: "Cycle not found for this HOD" });

    await RecruitmentCycle.update(
      { status: "QUERY", isFrozen: false, dofaComment: comment },
      { where: { id:cycle.id } }
    );
    
    // Email this specific HOD only
    const hod = await User.findByPk(hodId);
    await Comment.create({
      message: comment, fromRole: "DOFA", toRole: "HOD",
      cycle: cycle.cycle, targetUserId: hodId,fromDepartment:toCode(hod?.department)
    });

    if (hod?.email) {
      const tmpl = templates.dofaQueryToHod({
        hodName:    hod.name || hod.email,
        department: hod.department,
        comment,
      });
      await sendEmail(hod.email, tmpl.subject, tmpl.html).catch(console.error);
    }

    await createNotification({
      cycle: cycle.cycle, role: "HOD",
      title: "Query Raised by DOFA", message: comment,
      type: "COMMENT", targetUserId: hodId,
    });

    await log({
      user:        req.user,
      action:      "CYCLE_QUERY_RAISED",
      entity:      "RecruitmentCycle",
      entityId:    cycle.id,
      description: `Query raised for cycle ${cycle.id} by DOFA`,
      req,
    });

    res.json(cycle);
  } catch (err) {
    console.error("raiseQuery error:", err);
    res.status(500).json({ message: "Failed to raise query" });
  }
};

/* ════════════════════════════════════
   APPROVE
════════════════════════════════════ */
exports.approveCycle = async (req, res) => {
  try{
  const { hodId } = req.body;
  const cycle = await getCurrentCycle(hodId);
  if (!cycle) return res.status(404).json({ message: "Cycle not found for this HOD" }); 

  await RecruitmentCycle.update(
    { status: "APPROVED", isFrozen: true },
    { where: { id:cycle.id } }
  );

  const hod = await User.findByPk(hodId);

  await createNotification({
    cycle:   cycle.cycle,
    role:    "HOD",
    title:   "Cycle Approved",
    message: "DOFA has approved your submission.",
    type:    "STATUS",
    targetUserId: hodId,
  });

  await log({
  user:        req.user,
  action:      "CYCLE_APPROVED",
  entity:      "RecruitmentCycle",
  entityId:    cycle.id,
  description: `Cycle approved for department ${hod?.department || hodId}`,
  req,
});

  res.json(cycle);
}catch (err) {
  console.error("approveCycle error:", err);
  res.status(500).json({ message: "Failed to approve cycle" });
}};

/* ════════════════════════════════════
   SET INTERVIEW DATES
   DOFA enters teachingInteractionDate and interviewDate per HOD.
   ✅ FIX: Also unfreezes cycle so HOD can mark appeared candidates.
   Status → "INTERVIEW_SET"
════════════════════════════════════ */
exports.setInterviewDates = async (req, res) => {
  try {
    const { hodId, teachingInteractionDate, interviewDate } = req.body;
    const cycle = await getCurrentCycle(hodId);
    if (!cycle) return res.status(404).json({ message: "Cycle not found for this HOD" });
    if (!hodId)
      return res.status(400).json({ message: "hodId required" });

    if (cycle.status !== "APPROVED" && cycle.status !== "APPEARED_SUBMITTED")
      return res.status(400).json({
        message: "Dates can only be set after the cycle is approved",
      });

    // ✅ FIX: Unfreeze so HOD can mark appeared candidates
    await RecruitmentCycle.update(
      {
        teachingInteractionDate: teachingInteractionDate || null,
        interviewDate:           interviewDate           || null,
        status:                  "INTERVIEW_SET",
        isFrozen:                false,   // ← UNLOCK for HOD to mark appeared
      },
      { where: { id: cycle.id } }
    );

    if (interviewDate) {
      await createNotification({
        cycle:   cycle.cycle,
        role:    "HOD",
        title:   "Interview Date Set",
        message: `Interview scheduled on ${interviewDate}. Please mark appeared candidates and submit to DOFA.`,
        type:    "STATUS",
        targetUserId: hodId,
      });
    }

    const updated = await RecruitmentCycle.findOne({
      where: { id: cycle.id },
    });

    await log({
      user:        req.user,
      action:      "INTERVIEW_DATES_SET",
      entity:      "RecruitmentCycle",
      entityId:    cycle.id,
      description: `Interview dates set for cycle ${cycle.id}`,
      req,
    });

    res.json({ success: true, cycle: updated });
  } catch (err) {
    console.error("setInterviewDates error:", err.message);
    res.status(500).json({ message: "Failed to set dates" });
  }
};

/* ════════════════════════════════════
   UNFREEZE (DEV ONLY)
════════════════════════════════════ */
exports.unfreezeCycle = async (req, res) => {
  const cycle = await getCurrentCycle(req.user.id);
  if (!cycle) return res.status(404).json({ message: "Cycle not found for this HOD" });
  await RecruitmentCycle.update(
      { status: "DRAFT", isFrozen: false },
      { where: { id: cycle.id } }
    );

  res.json({ success: true, message: "Cycle unfrozen (DEV mode)" });
};

/* ════════════════════════════════════
   DOFA DASHBOARD
   Returns per-department stats for DOFA review portal.
════════════════════════════════════ */
exports.getDofaDashboard = async (req, res) => {
  const cycles = await RecruitmentCycle.findAll({
    order: [["createdAt", "DESC"]],
  });

  const cycleMap = {};
  cycles.forEach(c => {
    if (c.hodId) cycleMap[c.hodId] = c;
  });

  const activeCycleStrings = cycles.map(c => c.cycle);
  const candidates = await Candidate.findAll({
    where:   { cycle:activeCycleStrings},
    include: [{ model: User, as: "hod", attributes: ["id", "department", "email"] }],
  });

  const deptMap = {};
  candidates.forEach(c => {
    const dept = c.hod?.department;
    if (!dept) return;

    if (!deptMap[dept]) {
      deptMap[dept] = {
        department: dept,
        hodId:      c.hod.id,
        hodEmail:   c.hod.email,
        candidates: 0,
        appeared:   0,
      };
    }

    deptMap[dept].candidates++;
    if (c.appearedInInterview) deptMap[dept].appeared++;
  });

  const experts = await Expert.findAll({
    where:   { cycle: activeCycleStrings },
    include: [{ model: User, as: "uploadedBy", attributes: ["department"] }],
  });

  const expertMap = {};
  experts.forEach(e => {
    const dept = e.uploadedBy?.department;
    if (!dept) return;
    expertMap[dept] = (expertMap[dept] || 0) + 1;
  });

  const totalCandidates = await Candidate.count({ where: { cycle: activeCycleStrings } });
  const totalExperts    = await Expert.count({    where: { cycle: activeCycleStrings } });

  const departments   = Object.values(deptMap);
  const pendingCount  = departments.filter(d => cycleMap[d.hodId]?.status === "SUBMITTED").length;
  const approvedCount = departments.filter(d => cycleMap[d.hodId]?.status === "APPROVED").length;

  res.json({
    cycle: {
      status:      cycles.some(c => c.status === "SUBMITTED") ? "SUBMITTED" : "DRAFT",
      submittedAt: cycles[0]?.updatedAt,
    },
    summary: { pending: pendingCount, approved: approvedCount, totalCandidates, totalExperts },
    departments: departments.map(d => {
      const hodCycle = cycleMap[d.hodId];
      return {
        department:              d.department,
        hodEmail:                d.hodEmail,
        hodId:                   d.hodId,
        candidates:              d.candidates,
        appeared:                d.appeared,
        experts:                 expertMap[d.department] || 0,
        status:                  hodCycle?.status                  || "DRAFT",
        isFrozen:                hodCycle?.isFrozen                 || false,
        submittedDate:           hodCycle?.updatedAt                || null,
        academicYear:            hodCycle?.academicYear             || null,   // ✅ add
        cycleNumber:             hodCycle?.cycleNumber              || null,   // ✅ add
        teachingInteractionDate: hodCycle?.teachingInteractionDate  || null,
        interviewDate:           hodCycle?.interviewDate             || null,
      };
    }),
  });
};

/* ════════════════════════════════════
   DOFA OFFICE DASHBOARD
   Separate summary for DOFA_OFFICE role
   (ExpertTravel + SelectedCandidates stats)
════════════════════════════════════ */
exports.getDofaOfficeDashboard = async (req, res) => {
  try {
    const { ExpertTravel, SelectedCandidate } = require("../models");
    const { Op } = require("sequelize");
    const cycles = await RecruitmentCycle.findAll({ order: [["createdAt", "DESC"]] });
    const activeCycleStrings = cycles.map(c => c.cycle);
    const totalExperts = await Expert.count({ where: { cycle: activeCycleStrings } });

    // ExpertTravel stats
    const travels = await ExpertTravel.findAll({ where: { cycle: activeCycleStrings } });

    const confirmedExperts   = travels.filter(t => t.confirmed).length;
    const attendingOffline   = travels.filter(t => t.presenceStatus === "Offline" && t.confirmed).length;
    const attendingOnline    = travels.filter(t => t.presenceStatus === "Online"  && t.confirmed).length;
    const quotesPending      = travels.filter(t => t.quoteStatus === "PENDING").length;

    // Selected / appeared candidates (DOFA Office's "TOTAL CANDIDATES" view)
    const totalCandidates = await Candidate.count({ where: { cycle: activeCycleStrings } });
    const appearedCount   = await Candidate.count({
      where: { cycle: activeCycleStrings, appearedInInterview: true },
    });
    const selectedCount   = await SelectedCandidate.count({ where: { cycle: activeCycleStrings } });

    res.json({
      totalCandidates,
      appearedCount,
      selectedCount,
      totalExperts,
      confirmedExperts,
      attendingOffline,
      attendingOnline,
      quotesPending,
    });
  } catch (err) {
    console.error("getDofaOfficeDashboard error:", err.message);
    res.status(500).json({ message: "Failed to fetch dashboard" });
  }
};

exports.initiateCycle = async (req, res) => {
  try {
    const { academicYear, cycleNumber } = req.body;

    // Validation
    if (!academicYear || !/^\d{4}-\d{2}$/.test(academicYear))
      return res.status(400).json({ message: "Invalid academic year format (YYYY-YY)" });

    const cn = parseInt(cycleNumber);
    if (!cn || cn < 1 || cn > 10)
      return res.status(400).json({ message: "Cycle number must be 1–10" });

    // Check not already initiated for this HOD + year + cycle
    const existing = await RecruitmentCycle.findOne({
      where: { hodId: req.user.id, academicYear, cycleNumber: cn },
    });
    if (existing)
      return res.status(409).json({
        message: `Cycle ${cn} for ${academicYear} already exists for your department`,
      });

    const cycle = await RecruitmentCycle.create({
      cycle:        `${academicYear}-C${cn}`,   // e.g. "2025-26-C1"
      hodId:        req.user.id,
      academicYear,
      cycleNumber:  cn,
      status:       "DRAFT",
      isFrozen:     false,
    });

    await log({
      user:        req.user,
      action:      "CYCLE_INITIATED",
      entity:      "RecruitmentCycle",
      entityId:    cycle.id,
      description: `Cycle initiated for department ${req.user.department} (${cycle.cycle})`,
      req,
    });

    res.json({ success: true, cycle });
  } catch (err) {
    console.error("initiateCycle error:", err.message);
    res.status(500).json({ message: "Failed to initiate cycle" });
  }
};