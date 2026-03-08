const Candidate = require("../models/Candidate");
const Expert = require("../models/Expert");
const RecruitmentCycle = require("../models/RecruitmentCycle");
const { createNotification } = require("../utils/notify"); // ✅ FIX
const CYCLE = require("../config/activeCycle");
const parseCSV = require("../utils/csvParser");
const { notifyDofaUpload } = require("./email.controller");
const User = require("../models/User");

/* =========================================================
   ADD EXPERT
   ========================================================= */
exports.addExpert = async (req, res) => {
  try {
    const rc = await RecruitmentCycle.findOne({ cycle: CYCLE });

    if (rc?.isFrozen) {
      return res.status(403).json({
        message: "Cycle is frozen. Cannot add experts.",
      });
    }

    const expert = await Expert.create({
      ...req.body,
      department: req.body.department.toUpperCase(),
      cycle: CYCLE,
    });

    res.json(expert);
  } catch (err) {
    res.status(400).json({
      message:
        err.code === 11000
          ? "Expert with this email already exists"
          : err.message,
    });
  }
};

/* =========================================================
   GET EXPERTS
   ========================================================= */
exports.getExperts = async (req, res) => {
  const experts = await Expert.find({ cycle: CYCLE });
  res.json(experts);
};
/* =========================================================
   DELETE ALL EXPERTS (HOD)
========================================================= */
exports.clearExperts = async (req, res) => {
  try {
    const rc = await RecruitmentCycle.findOne({ cycle: CYCLE });

    if (rc?.isFrozen) {
      return res.status(403).json({
        message: "Cycle is frozen. Cannot delete experts.",
      });
    }

    await Expert.deleteMany({ cycle: CYCLE });

    res.json({ message: "All experts deleted successfully" });

  } catch (err) {
    console.error("Clear Experts Error:", err);
    res.status(500).json({ message: "Failed to delete experts" });
  }
};

/* =========================================================
   HOD COUNTS (Dashboard)
   ========================================================= */
exports.getHodCounts = async (req, res) => {
  const candidateCount = await Candidate.countDocuments({ cycle: CYCLE });
  const expertCount = await Expert.countDocuments({ cycle: CYCLE });

  res.json({
    candidates: candidateCount,
    experts: expertCount,
  });
};

// GET ALL EXPERTS (DOFA)
exports.getAllExperts = async (req, res) => {
  try {
    const experts = await Expert.find({ cycle: CYCLE })
    .populate("uploadedBy", "name department")
      .sort({ createdAt: 1 });
    console.log("Experts with populate:", experts);
    res.json(experts);
  } catch (err) {
    console.error("getAllExperts error:", err);
    res.status(500).json({ message: "Failed to fetch experts" });
  }
};

exports.uploadExpertsCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file required" });
    }

    const filePath = req.file.path;
    const experts = await parseCSV(filePath);

    if (!experts.length) {
      return res.status(400).json({ message: "CSV is empty" });
    }
    const hodId=req.user._id;
    const formattedExperts = experts.map((row) => ({
      cycle: CYCLE,
      fullName: row["Full Name (with Salutation)"]?.trim(),
      designation: row["Designation"]?.trim(),
      department: row["Department"]?.trim().toUpperCase(),
      institute: row["Institute"]?.trim(),
      email: row["Email"]?.trim().toLowerCase(),
      specialization: row["Specialization"]?.trim(),
      uploadedBy: req.user._id,
    }));

    await Expert.insertMany(formattedExperts);
    const hod = await User.findById(hodId);

      notifyDofaUpload({
        department: hod.department,
        hodName: hod.name,
      }).catch(err =>
        console.error("Email failed:", err)
      );

      res.status(200).json({ message: "Experts uploaded successfully",count:formattedExperts.length });

  } catch (error) {
    console.error("Upload Experts Error:", error);
    res.status(500).json({ message: error.message });
  }
};
