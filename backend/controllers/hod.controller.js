const { Candidate, Expert, RecruitmentCycle, User } = require("../models");
const { createNotification } = require("../utils/notify");
const CYCLE = require("../config/activeCycle");
const parseCSV = require("../utils/csvParser");
const { notifyDofaUpload } = require("./email.controller");
const { Op } = require("sequelize");

/* =========================================================
   ADD EXPERT
========================================================= */
exports.addExpert = async (req, res) => {
  try {
    const rc = await RecruitmentCycle.findOne({
      where: { cycle: CYCLE }
    });

    if (rc?.isFrozen) {
      return res.status(403).json({
        message: "Cycle is frozen. Cannot add experts.",
      });
    }

    const expert = await Expert.create({
      ...req.body,
      department: req.body.department.toUpperCase(),
      cycle: CYCLE,
      uploadedById: req.user.id
    });

    res.json(expert);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* =========================================================
   GET EXPERTS (HOD)
========================================================= */
exports.getExperts = async (req, res) => {
  const experts = await Expert.findAll({
    where: {
      cycle: CYCLE,
      uploadedById: req.user.id
    },
    order: [["createdAt", "ASC"]]
  });

  res.json(experts);
};

/* =========================================================
   DELETE ALL EXPERTS
========================================================= */
exports.clearExperts = async (req, res) => {
  try {
    const rc = await RecruitmentCycle.findOne({
      where: { cycle: CYCLE }
    });

    if (rc?.isFrozen) {
      return res.status(403).json({
        message: "Cycle is frozen. Cannot delete experts.",
      });
    }

    await Expert.destroy({
      where: { cycle: CYCLE }
    });

    res.json({ message: "All experts deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Failed to delete experts" });
  }
};

/* =========================================================
   HOD COUNTS
========================================================= */
exports.getHodCounts = async (req, res) => {
  const candidateCount = await Candidate.count({
    where: {
      cycle: CYCLE,
      hodId: req.user.id
    }
  });

  const expertCount = await Expert.count({
    where: {
      cycle: CYCLE,
      uploadedById: req.user.id
    }
  });

  res.json({
    candidates: candidateCount,
    experts: expertCount,
  });
};

/* =========================================================
   GET ALL EXPERTS (DOFA)
========================================================= */
exports.getAllExperts = async (req, res) => {
  try {
    const experts = await Expert.findAll({
      where: { cycle: CYCLE },
      include: [
        {
          model: User,
          as: "uploadedBy",
          attributes: ["name", "department"]
        }
      ],
      order: [["createdAt", "ASC"]]
    });

    res.json(experts);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch experts" });
  }
};

/* =========================================================
   UPLOAD EXPERTS CSV
========================================================= */
exports.uploadExpertsCSV = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "CSV file required" });

    const experts = await parseCSV(req.file.path);

    if (!experts.length)
      return res.status(400).json({ message: "CSV is empty" });

    const hodId = req.user.id;

    const formattedExperts = experts.map(row => ({
      cycle: CYCLE,
      fullName: row["Full Name (with Salutation)"]?.trim(),
      designation: row["Designation"]?.trim(),
      department: row["Department"]?.trim()?.toUpperCase(),
      institute: row["Institute"]?.trim(),
      email: row["Email"]?.trim()?.toLowerCase(),
      specialization: row["Specialization"]?.trim(),
      uploadedById: hodId
    }));

    // ❌ insertMany → ✅ bulkCreate
    await Expert.bulkCreate(formattedExperts);

    const hod = await User.findByPk(hodId);

    notifyDofaUpload({
      department: hod.department,
      hodName: hod.name,
    }).catch(console.error);

    res.json({
      message: "Experts uploaded successfully",
      count: formattedExperts.length
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};