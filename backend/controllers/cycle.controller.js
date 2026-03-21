const RecruitmentCycle = require("../models/RecruitmentCycle");
const { createNotification } = require("../utils/notify");
const CYCLE = require("../config/activeCycle");
const Expert = require("../models/Expert");
const Comment = require("../models/Comment");
const Candidate = require("../models/Candidate");

/* ================================
   GET CURRENT CYCLE (HOD + DOFA)
================================ */
exports.getCurrentCycle = async (req, res) => {
  let cycle = await RecruitmentCycle.findOne({ cycle: CYCLE,hod:req.user._id });

  if (!cycle) {
    cycle = await RecruitmentCycle.create({
      cycle: CYCLE,
      hod:req.user._id,
      status: "DRAFT",
      isFrozen: false,
    });
  }

  res.json(cycle);
};

/* ================================
   HOD → SUBMIT TO DOFA
   (NO CHANGE IN BEHAVIOR)
================================ */
exports.submitToDofa = async (req, res) => {
  const cycle = await RecruitmentCycle.findOne({ cycle: CYCLE,hod:req.user._id });

  cycle.status = "SUBMITTED";
  cycle.isFrozen = true;
  await cycle.save();

  // optional notification (already existed)
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
   DOFA → RAISE QUERY
   (Unfreezes for HOD edits)
================================ */
exports.raiseQuery = async (req, res) => {
  try {
    const { comment,hodId } = req.body;

    if (!comment) {
      return res.status(400).json({ message: "Comment required" });
    }

    const cycle = await RecruitmentCycle.findOne({ cycle: CYCLE,hod:hodId });

    /* ---------------------------
       UPDATE CYCLE STATUS
    ---------------------------- */
    cycle.status = "QUERY";
    cycle.isFrozen = false;
    cycle.dofaComment = comment;
    await cycle.save();

    /* ---------------------------
       SAVE COMMENT FOR COMMENTS TAB
    ---------------------------- */
    await Comment.create({
      message: comment,
      fromRole: "DOFA",
      toRole: "HOD",
      cycle: CYCLE
    });

    /* ---------------------------
       SEND NOTIFICATION
    ---------------------------- */
    await createNotification({
      cycle: CYCLE,
      role: "HOD",
      title: "Query Raised by DOFA",
      message: comment,
      type: "COMMENT",
    });

    res.json(cycle);

  } catch (err) {
    console.error("Raise Query Error:", err);
    res.status(500).json({ message: "Failed to raise query" });
  }
};

/* ================================
   DOFA → APPROVE
================================ */
exports.approveCycle = async (req, res) => {
  const {hodId}=req.body;
  const cycle = await RecruitmentCycle.findOne({ cycle: CYCLE,hod:hodId });

  cycle.status = "APPROVED";
  cycle.isFrozen = true; // 🔒 final lock
  await cycle.save();

  res.json(cycle);
};

/* ================================
   DEV ONLY: UNFREEZE (NO CHANGE)
================================ */
exports.unfreezeCycle = async (req, res) => {
  await RecruitmentCycle.updateOne(
    { cycle: CYCLE,hod:req?.user._id },
    {
      isFrozen: false,
      status: "DRAFT",
    },
    { upsert: true }
  );

  res.json({
    success: true,
    message: "Cycle unfrozen (DEV mode)",
  });
};

exports.getDofaDashboard = async (req, res) => {
  // FIX: find ALL cycles for this cycle year, not just one

  const cycles = await RecruitmentCycle.find({ cycle: CYCLE });

  // A department shows Approve/Query buttons when its cycle is SUBMITTED
  // Build a map of hodId → cycle status
  const cycleMap = {};
  cycles.forEach(c => {
    if (c.hod) cycleMap[c.hod.toString()] = c;
  });
  const departments = await Candidate.aggregate([
    { $match: { cycle: CYCLE } },
    {
      $lookup: {
        from: "users",
        localField: "hod",
        foreignField: "_id",
        as: "hod",
      },
    },
    { $unwind: "$hod" },
    {
      $group: {
        _id: "$hod.department",
        hodId:    { $first: "$hod._id" },
        hodEmail: { $first: "$hod.email" },
        candidates: { $sum: 1 },
      },
    },
  ]);

  const expertCounts = await Expert.aggregate([
    { $match: { cycle: CYCLE } },
    {
      $lookup: {
        from: "users",
        localField: "uploadedBy",
        foreignField: "_id",
        as: "hod",
      },
    },
    { $unwind: "$hod" },
    {
      $group: {
        _id: "$hod.department",
        count: { $sum: 1 },
      },
    },
  ]);

  const expertMap = {};
  expertCounts.forEach(e => { expertMap[e._id] = e.count; });

  const totalCandidates = await Candidate.countDocuments({ cycle: CYCLE });
  const totalExperts    = await Expert.countDocuments({ cycle: CYCLE });

  const pendingCount  = departments.filter(d => {
    const c = cycleMap[d.hodId?.toString()];
    return c?.status === "SUBMITTED";
  }).length;

  const approvedCount = departments.filter(d => {
    const c = cycleMap[d.hodId?.toString()];
    return c?.status === "APPROVED";
  }).length;

  res.json({
    cycle: {
      // Use the most recent status for display
      status: cycles.some(c => c.status === "SUBMITTED") ? "SUBMITTED" : "DRAFT",
      submittedAt: cycles[0]?.updatedAt,
    },
    summary: {
      pending:         pendingCount,
      approved:        approvedCount,
      totalCandidates,
      totalExperts,
    },
    departments: departments.map(d => {
      // Get THIS department's HOD cycle status
      const hodCycle = cycleMap[d.hodId?.toString()];
      return {
        department:    d._id,
        hodEmail:      d.hodEmail,
        candidates:    d.candidates,
        experts:       expertMap[d._id] || 0,
        status:        hodCycle?.status      || "DRAFT",
        isFrozen:      hodCycle?.isFrozen    || false,
        submittedDate: hodCycle?.updatedAt   || null,
        position:      "Assistant Professor",
        hodId:         d.hodId,
      };
    }),
  });
};