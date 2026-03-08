const RecruitmentCycle = require("../models/RecruitmentCycle");
const { createNotification } = require("../utils/notify");
const CYCLE = require("../config/activeCycle");
const Expert = require("../models/Expert");
const archiver = require("archiver");
const fs = require("fs");
const path = require("path");
const Candidate = require("../models/Candidate");
const User = require("../models/User");

/* ================================
   GET CURRENT CYCLE (HOD + DOFA)
================================ */
exports.getCurrentCycle = async (req, res) => {
  let cycle = await RecruitmentCycle.findOne({ cycle: CYCLE });

  if (!cycle) {
    cycle = await RecruitmentCycle.create({
      cycle: CYCLE,
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
  const cycle = await RecruitmentCycle.findOne({ cycle: CYCLE });

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
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ message: "Comment required" });
  }

  const cycle = await RecruitmentCycle.findOne({ cycle: CYCLE });

  cycle.status = "QUERY";
  cycle.isFrozen = false;
  cycle.dofaComment = comment;
  await cycle.save();

  await createNotification({
    cycle: CYCLE,
    role: "HOD",
    title: "Query Raised by DOFA",
    message: comment,
    type: "COMMENT",
  });

  res.json(cycle);
};

/* ================================
   DOFA → APPROVE
================================ */
exports.approveCycle = async (req, res) => {
  const cycle = await RecruitmentCycle.findOne({ cycle: CYCLE });

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
    { cycle: CYCLE },
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
  let cycle = await RecruitmentCycle.findOne({ cycle: CYCLE });

  if (!cycle) {
    cycle = await RecruitmentCycle.create({
      cycle: CYCLE,
      status: "DRAFT",
      isFrozen: false,
    });
  }

  /* -------------------------------
     CANDIDATE COUNTS BY HOD
  --------------------------------*/
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
        hodEmail: { $first: "$hod.email" },
        candidates: { $sum: 1 },
      },
    },
  ]);

  /* -------------------------------
     EXPERT COUNTS BY HOD DEPARTMENT
  --------------------------------*/
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
  expertCounts.forEach(e => {
    expertMap[e._id] = e.count;
  });

  const totalCandidates = await Candidate.countDocuments({ cycle: CYCLE });
  const totalExperts = await Expert.countDocuments({ cycle: CYCLE });

  res.json({
    cycle: {
      status: cycle.status,
      submittedAt: cycle.updatedAt,
    },
    summary: {
      pending: cycle.status === "SUBMITTED" ? departments.length : 0,
      approved: cycle.status === "APPROVED" ? departments.length : 0,
      totalCandidates,
      totalExperts,
    },
    departments: departments.map(d => ({
      department: d._id,
      hodEmail: d.hodEmail,
      candidates: d.candidates,
      experts: expertMap[d._id] || 0, // ✅ NOW CORRECT
      status: cycle.status,
      submittedDate: cycle.updatedAt,
      position: "Assistant Professor",
    })),
  });
};
