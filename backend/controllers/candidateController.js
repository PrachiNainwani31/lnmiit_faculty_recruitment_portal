const Candidate = require("../models/Candidate");
const CandidateStats = require("../models/CandidateStats");
const parseCSV = require("../utils/csvParser");
const { createNotification } = require("../utils/notify");
const { Parser } = require("json2csv");
const CYCLE = require("../config/activeCycle");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const { notifyDofaUpload } = require("./email.controller");

/* =====================================================
   UPLOAD CANDIDATES CSV (STEP 2)
===================================================== */
exports.uploadCandidates = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "CSV file missing" });

    const rows = await parseCSV(req.file.path);
    const hodId = req.user._id;

    const validRows = rows.filter(
      r =>
        r.fullName &&
        r.email &&
        r.phone &&
        r.qualification &&
        r.specialization
    );

    const stats = await CandidateStats.findOne({ cycle: CYCLE,hod:hodId });
    if (!stats)
      return res.status(400).json({
        message: "Please enter ILSC count before uploading CSV",
      });

    if (validRows.length !== stats.ilscShortlisted) {
      return res.status(400).json({
        message: `Upload exactly ${stats.ilscShortlisted} candidates`,
      });
    }

    // ✅ delete ONLY this HOD’s candidates
    await Candidate.deleteMany({ cycle: CYCLE, hod: hodId });

    const formatted = [];

    for (let r of validRows) {
      let user = await User.findOne({ email: r.email });

      if (!user) {
        user = await User.create({
          name: r.fullName,
          email: r.email,
          password: "123", // or random
          role: "CANDIDATE",
          active: true
        });
      }

      formatted.push({
        cycle: CYCLE,
        srNo: r.srNo,
        fullName: r.fullName,
        email: r.email,
        phone: r.phone,
        qualification: r.qualification,
        specialization: r.specialization,
        reviewerObservation: r.reviewerObservation || "",
        ilscComments: r.ilscComments || "",
        hod: hodId,

        // 🔥 MOST IMPORTANT LINE
        user: user._id
      });
    }

    await Candidate.insertMany(formatted);
    const hod = await User.findById(hodId);

      notifyDofaUpload({
        department: hod.department,
        hodName: hod.name,
      }).catch(err =>
        console.error("Email failed:", err)
      );

    await createNotification({
      cycle: CYCLE,
      role: "DOFA",
      title: "Candidate List Updated",
      message: "HOD uploaded candidate list",
      type: "UPLOAD",
    });

    res.json({ success: true, count: formatted.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "CSV upload failed" });
  }
};

/* =====================================================
   GET CANDIDATES
===================================================== */
// In candidateController.js — getCandidatesByCycle
exports.getCandidatesByCycle = async (req, res) => {
  const filter = { cycle: CYCLE };
  if (req.user.role === "HOD") filter.hod = req.user._id;

  const candidates = await Candidate.find(filter)
    .populate("hod", "department")  // ← populate HOD's department
    .sort({ srNo: 1 });

  // Map to include department
  const result = candidates.map(c => ({
    ...c.toObject(),
    department: c.hod?.department || "Unknown"
  }));

  res.json(result);
};

/* =====================================================
   DELETE SINGLE CANDIDATE
===================================================== */
exports.deleteCandidate = async (req, res) => {
  await Candidate.deleteOne({ _id: req.params.id });
  res.json({ success: true });
};

/* =====================================================
   CLEAR ALL CANDIDATES + STATS
===================================================== */
exports.clearCandidateStats = async (req, res) => {
  await CandidateStats.deleteOne({ cycle: CYCLE,hod:req.user._id });
  await Candidate.deleteMany({ cycle: CYCLE,hod:req.user._id });
  res.json({ success: true });
};

/* =====================================================
   SAVE STATS (STEP 1)
===================================================== */
exports.saveCandidateStats = async (req, res) => {
  const { totalApplications, dlscShortlisted, ilscShortlisted } = req.body;

  const stats = await CandidateStats.findOneAndUpdate(
    { cycle: CYCLE,hod:req.user._id },
    { cycle: CYCLE,hod:req.user._id, totalApplications, dlscShortlisted, ilscShortlisted },
    { upsert: true, new: true }
  );

  res.json(stats);
};

exports.getCandidateStats = async (req, res) => {
  const stats = await CandidateStats.findOne({ cycle: CYCLE,hod:req.user._id });
  res.json(stats);
};

/* =====================================================
   STATUS API (VERY IMPORTANT)
===================================================== */
exports.getCandidateStatus = async (req, res) => {
  const stats = await CandidateStats.findOne({ cycle: CYCLE,hod:req.user._id });
  const uploadedCount = await Candidate.countDocuments({ cycle: CYCLE,hod:req.user._id,});

  res.json({
    statsEntered: !!stats,
    ilscCount: stats?.ilscShortlisted || 0,
    uploadedCount,
  });
};

/* =====================================================
   DOWNLOAD CSV TEMPLATE
===================================================== */
exports.downloadTemplate = async (req, res) => {
  const stats = await CandidateStats.findOne({ cycle: CYCLE });
  if (!stats) {
    return res.status(400).json({ message: "Stats not found" });
  }

  const fields = [
    "srNo",
    "fullName",
    "email",
    "phone",
    "qualification",
    "specialization",
    "reviewerObservation",
    "ilscComments",
  ];

  const rows = Array.from({ length: stats.ilscShortlisted }).map((_, i) => ({
    srNo: i + 1,
    fullName: "",
    email: "",
    phone: "",
    qualification: "",
    specialization: "",
    reviewerObservation: "",
    ilscComments: "",
  }));

  const parser = new Parser({ fields });
  const csv = parser.parse(rows);

  res.header("Content-Type", "text/csv");
  res.attachment(`ILSC_Candidates_${CYCLE}.csv`);
  res.send(csv);
};

exports.uploadResumes = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "ZIP file required",
      });
    }

    res.json({
      message: "Resume ZIP uploaded successfully",
    });

  } catch (err) {
    console.error("Upload ZIP Error:", err);
    res.status(500).json({
      message: "Upload failed",
    });
  }
};

exports.getCandidatesByDepartment = async (req, res) => {
   if (req.user.role !== "DOFA") {
    return res.status(403).json({ message: "Access denied" });
  }
  const { department } = req.params;

  const hod = await User.findOne({ role: "HOD", department });
  if (!hod)
    return res.status(404).json({ message: "HOD not found" });

  const candidates = await Candidate.find({
    hod: hod._id,
    cycle: CYCLE,
  }).sort({ srNo: 1 });
  res.json(candidates);
};

exports.getUploadedResumes = async (req, res) => {
  const department = req.user.department;

  const filePath = path.join(
    __dirname,
    "../uploads/resumes",
    CYCLE,
    department,
    "resumes.zip"
  );

  if (!fs.existsSync(filePath)) {
    return res.json([]);
  }

  res.json([
    {
      name: "resumes.zip",
      url: `/uploads/resumes/${CYCLE}/${department}/resumes.zip`,
    },
  ]);
};
