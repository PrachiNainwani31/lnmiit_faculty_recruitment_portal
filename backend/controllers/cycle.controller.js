// controllers/cycle.controller.js
const { RecruitmentCycle, Expert, Comment, Candidate, User } = require("../models");
const { createNotification } = require("../utils/notify");
const CYCLE = require("../config/activeCycle");

/* ════════════════════════════════════
   GET CURRENT CYCLE
════════════════════════════════════ */
exports.getCurrentCycle = async (req, res) => {
  let cycle = await RecruitmentCycle.findOne({
    where: { cycle: CYCLE, hodId: req.user.id },
  });

  if (!cycle) {
    cycle = await RecruitmentCycle.create({
      cycle:    CYCLE,
      hodId:    req.user.id,
      status:   "DRAFT",
      isFrozen: false,
    });
  }

  res.json(cycle);
};

/* ════════════════════════════════════
   SUBMIT TO DOFA  (first submission — candidates + experts)
════════════════════════════════════ */
exports.submitToDofa = async (req, res) => {
  await RecruitmentCycle.update(
    { status: "SUBMITTED", isFrozen: true },
    { where: { cycle: CYCLE, hodId: req.user.id } }
  );

  const cycle = await RecruitmentCycle.findOne({
    where: { cycle: CYCLE, hodId: req.user.id },
  });

  await createNotification({
    cycle:   CYCLE,
    role:    "DOFA",
    title:   "Cycle Submitted",
    message: "HoD submitted candidate and expert lists for review.",
    type:    "STATUS",
  });

  res.json(cycle);
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
    // Must have interview date set before submitting appeared
    const cycle = await RecruitmentCycle.findOne({
      where: { cycle: CYCLE, hodId: req.user.id },
    });

    if (!cycle)
      return res.status(404).json({ message: "Cycle not found" });

    if (!cycle.interviewDate)
      return res.status(400).json({
        message: "Interview date not set. Cannot submit appeared candidates.",
      });

    // Freeze and mark as appeared-submitted for this HOD
    await RecruitmentCycle.update(
      { status: "APPEARED_SUBMITTED", isFrozen: true },
      { where: { cycle: CYCLE, hodId: req.user.id } }
    );

    // Notify DOFA
    const hod = await User.findByPk(req.user.id);
    await createNotification({
      cycle:   CYCLE,
      role:    "DOFA",
      title:   "Appeared Candidates Submitted",
      message: `HOD (${hod?.department || req.user.id}) has submitted appeared candidate data.`,
      type:    "STATUS",
    });

    // Check if ALL HODs with approved/appeared cycles have now submitted
    const allCycles = await RecruitmentCycle.findAll({
      where: { cycle: CYCLE },
    });

    const activeCycles   = allCycles.filter(c =>
      ["APPROVED", "INTERVIEW_SET", "APPEARED_SUBMITTED"].includes(c.status)
    );
    const submittedCount = activeCycles.filter(c => c.status === "APPEARED_SUBMITTED").length;

    if (submittedCount === activeCycles.length && activeCycles.length > 0) {
      await createNotification({
        cycle:   CYCLE,
        role:    "DOFA",
        title:   "All Departments Submitted Appeared Data",
        message: `All ${submittedCount} department(s) have submitted their appeared candidate data. You may now proceed with selection.`,
        type:    "STATUS",
      });
    }

    const updated = await RecruitmentCycle.findOne({
      where: { cycle: CYCLE, hodId: req.user.id },
    });

    res.json({ success: true, cycle: updated });
  } catch (err) {
    console.error("submitAppearedToDofa error:", err.message);
    res.status(500).json({ message: "Failed to submit" });
  }
};

/* ════════════════════════════════════
   RAISE QUERY
════════════════════════════════════ */
exports.raiseQuery = async (req, res) => {
  try {
    const { comment, hodId } = req.body;

    if (!comment)
      return res.status(400).json({ message: "Comment required" });

    await RecruitmentCycle.update(
      { status: "QUERY", isFrozen: false, dofaComment: comment },
      { where: { cycle: CYCLE, hodId } }
    );

    const cycle = await RecruitmentCycle.findOne({
      where: { cycle: CYCLE, hodId },
    });

    await Comment.create({
      message:  comment,
      fromRole: "DOFA",
      toRole:   "HOD",
      cycle:    CYCLE,
    });

    await createNotification({
      cycle:   CYCLE,
      role:    "HOD",
      title:   "Query Raised by DOFA",
      message: comment,
      type:    "COMMENT",
    });

    res.json(cycle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to raise query" });
  }
};

/* ════════════════════════════════════
   APPROVE
════════════════════════════════════ */
exports.approveCycle = async (req, res) => {
  const { hodId } = req.body;

  await RecruitmentCycle.update(
    { status: "APPROVED", isFrozen: true },
    { where: { cycle: CYCLE, hodId } }
  );

  const cycle = await RecruitmentCycle.findOne({
    where: { cycle: CYCLE, hodId },
  });

  await createNotification({
    cycle:   CYCLE,
    role:    "HOD",
    title:   "Cycle Approved",
    message: "DOFA has approved your submission.",
    type:    "STATUS",
  });

  res.json(cycle);
};

/* ════════════════════════════════════
   SET INTERVIEW DATES
   DOFA enters teachingInteractionDate and interviewDate per HOD.
   ✅ FIX: Also unfreezes cycle so HOD can mark appeared candidates.
   Status → "INTERVIEW_SET"
════════════════════════════════════ */
exports.setInterviewDates = async (req, res) => {
  try {
    const { hodId, teachingInteractionDate, interviewDate } = req.body;

    if (!hodId)
      return res.status(400).json({ message: "hodId required" });

    const cycle = await RecruitmentCycle.findOne({
      where: { cycle: CYCLE, hodId },
    });

    if (!cycle)
      return res.status(404).json({ message: "Cycle not found for this HOD" });

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
      { where: { cycle: CYCLE, hodId } }
    );

    if (interviewDate) {
      await createNotification({
        cycle:   CYCLE,
        role:    "HOD",
        title:   "Interview Date Set",
        message: `Interview scheduled on ${interviewDate}. Please mark appeared candidates and submit to DOFA.`,
        type:    "STATUS",
      });
    }

    const updated = await RecruitmentCycle.findOne({
      where: { cycle: CYCLE, hodId },
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
  await RecruitmentCycle.upsert({
    cycle:    CYCLE,
    hodId:    req.user?.id,
    status:   "DRAFT",
    isFrozen: false,
  });

  res.json({ success: true, message: "Cycle unfrozen (DEV mode)" });
};

/* ════════════════════════════════════
   DOFA DASHBOARD
   Returns per-department stats for DOFA review portal.
════════════════════════════════════ */
exports.getDofaDashboard = async (req, res) => {
  const cycles = await RecruitmentCycle.findAll({
    where: { cycle: CYCLE },
  });

  const cycleMap = {};
  cycles.forEach(c => {
    if (c.hodId) cycleMap[c.hodId] = c;
  });

  const candidates = await Candidate.findAll({
    where:   { cycle: CYCLE },
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
    where:   { cycle: CYCLE },
    include: [{ model: User, as: "uploadedBy", attributes: ["department"] }],
  });

  const expertMap = {};
  experts.forEach(e => {
    const dept = e.uploadedBy?.department;
    if (!dept) return;
    expertMap[dept] = (expertMap[dept] || 0) + 1;
  });

  const totalCandidates = await Candidate.count({ where: { cycle: CYCLE } });
  const totalExperts    = await Expert.count({    where: { cycle: CYCLE } });

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
        position:                "Assistant Professor",
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

    const totalExperts = await Expert.count({ where: { cycle: CYCLE } });

    // ExpertTravel stats
    const travels = await ExpertTravel.findAll({ where: { cycle: CYCLE } });

    const confirmedExperts   = travels.filter(t => t.confirmed).length;
    const attendingOffline   = travels.filter(t => t.presenceStatus === "Offline" && t.confirmed).length;
    const attendingOnline    = travels.filter(t => t.presenceStatus === "Online"  && t.confirmed).length;
    const quotesPending      = travels.filter(t => t.quote?.status === "PENDING").length;

    // Selected / appeared candidates (DOFA Office's "TOTAL CANDIDATES" view)
    const totalCandidates = await Candidate.count({ where: { cycle: CYCLE } });
    const appearedCount   = await Candidate.count({
      where: { cycle: CYCLE, appearedInInterview: true },
    });
    const selectedCount   = await SelectedCandidate.count({ where: { cycle: CYCLE } });

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