const { RecruitmentCycle, Expert, Comment, Candidate, User } = require("../models");
const { createNotification } = require("../utils/notify");
const CYCLE = require("../config/activeCycle");

/* ================================
   GET CURRENT CYCLE
================================ */
exports.getCurrentCycle = async (req, res) => {
  let cycle = await RecruitmentCycle.findOne({
    where: { cycle: CYCLE, hodId: req.user.id }
  });

  if (!cycle) {
    cycle = await RecruitmentCycle.create({
      cycle: CYCLE,
      hodId: req.user.id,
      status: "DRAFT",
      isFrozen: false,
    });
  }

  res.json(cycle);
};

/* ================================
   SUBMIT TO DOFA
================================ */
exports.submitToDofa = async (req, res) => {
  await RecruitmentCycle.update(
    { status: "SUBMITTED", isFrozen: true },
    { where: { cycle: CYCLE, hodId: req.user.id } }
  );

  const cycle = await RecruitmentCycle.findOne({
    where: { cycle: CYCLE, hodId: req.user.id }
  });

  await createNotification({
    cycle: CYCLE,
    role: "DOFA",
    title: "Cycle Submitted",
    message: "HoD submitted candidate and expert lists for review.",
    type: "STATUS",
  });

  res.json(cycle);
};

/* ================================
   RAISE QUERY
================================ */
exports.raiseQuery = async (req, res) => {
  try {
    const { comment, hodId } = req.body;

    if (!comment)
      return res.status(400).json({ message: "Comment required" });

    await RecruitmentCycle.update(
      {
        status: "QUERY",
        isFrozen: false,
        dofaComment: comment
      },
      { where: { cycle: CYCLE, hodId } }
    );

    const cycle = await RecruitmentCycle.findOne({
      where: { cycle: CYCLE, hodId }
    });

    await Comment.create({
      message: comment,
      fromRole: "DOFA",
      toRole: "HOD",
      cycle: CYCLE
    });

    await createNotification({
      cycle: CYCLE,
      role: "HOD",
      title: "Query Raised by DOFA",
      message: comment,
      type: "COMMENT",
    });

    res.json(cycle);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to raise query" });
  }
};

/* ================================
   APPROVE
================================ */
exports.approveCycle = async (req, res) => {
  const { hodId } = req.body;

  await RecruitmentCycle.update(
    { status: "APPROVED", isFrozen: true },
    { where: { cycle: CYCLE, hodId } }
  );

  const cycle = await RecruitmentCycle.findOne({
    where: { cycle: CYCLE, hodId }
  });

  res.json(cycle);
};

/* ================================
   UNFREEZE
================================ */
exports.unfreezeCycle = async (req, res) => {
  await RecruitmentCycle.upsert({
    cycle: CYCLE,
    hodId: req.user.id,
    status: "DRAFT",
    isFrozen: false
  });

  res.json({
    success: true,
    message: "Cycle unfrozen (DEV mode)",
  });
};

/* ================================
   DOFA DASHBOARD
================================ */
exports.getDofaDashboard = async (req, res) => {
  const cycles = await RecruitmentCycle.findAll({
    where: { cycle: CYCLE }
  });

  const cycleMap = {};
  cycles.forEach(c => {
    if (c.hodId) cycleMap[c.hodId] = c;
  });

  // ✅ Fix 1: Candidate has two User associations — must specify alias "hod"
  const candidates = await Candidate.findAll({
    where: { cycle: CYCLE },
    include: [
      {
        model: User,
        as: "hod",                              // ← was "uploadedBy" (wrong)
        attributes: ["id", "department", "email"]
      }
    ]
  });

  const deptMap = {};

  candidates.forEach(c => {
    const dept = c.hod?.department;             // ← was correct but include was wrong
    if (!dept) return;

    if (!deptMap[dept]) {
      deptMap[dept] = {
        department: dept,
        hodId: c.hod.id,
        hodEmail: c.hod.email,
        candidates: 0
      };
    }

    deptMap[dept].candidates++;
  });

  // ✅ Fix 2: Expert alias must be "uploadedBy" not "hod"
  const experts = await Expert.findAll({
    where: { cycle: CYCLE },
    include: [
      {
        model: User,
        as: "uploadedBy",                       // ← was "hod" (wrong)
        attributes: ["department"]
      }
    ]
  });

  const expertMap = {};

  experts.forEach(e => {
    const dept = e.uploadedBy?.department;      // ← was "e.uoloadedBy" (typo)
    if (!dept) return;

    expertMap[dept] = (expertMap[dept] || 0) + 1;
  });

  const totalCandidates = await Candidate.count({ where: { cycle: CYCLE } });
  const totalExperts    = await Expert.count({    where: { cycle: CYCLE } });

  const departments  = Object.values(deptMap);
  const pendingCount  = departments.filter(d => cycleMap[d.hodId]?.status === "SUBMITTED").length;
  const approvedCount = departments.filter(d => cycleMap[d.hodId]?.status === "APPROVED").length;

  res.json({
    cycle: {
      status: cycles.some(c => c.status === "SUBMITTED") ? "SUBMITTED" : "DRAFT",
      submittedAt: cycles[0]?.updatedAt,
    },
    summary: { pending: pendingCount, approved: approvedCount, totalCandidates, totalExperts },
    departments: departments.map(d => {
      const hodCycle = cycleMap[d.hodId];
      return {
        department:    d.department,
        hodEmail:      d.hodEmail,
        candidates:    d.candidates,
        experts:       expertMap[d.department] || 0,
        status:        hodCycle?.status     || "DRAFT",
        isFrozen:      hodCycle?.isFrozen   || false,
        submittedDate: hodCycle?.updatedAt  || null,
        position:      "Assistant Professor",
        hodId:         d.hodId,
      };
    }),
  });
};