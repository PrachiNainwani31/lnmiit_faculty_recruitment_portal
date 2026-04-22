const { Candidate, Expert, RecruitmentCycle, User } = require("../models");
const { createNotification } = require("../utils/notify");
const getCurrentCycle = require("../utils/getCurrentCycle");
const parseCSV = require("../utils/csvParser");
const { notifyDofaUpload } = require("./email.controller");
const { Op } = require("sequelize");

/* =========================================================
   ADD EXPERT
========================================================= */
exports.addExpert = async (req, res) => {
  try {
    const hodCycle = await getCurrentCycle(req.user.id);
    if (!hodCycle) return res.status(400).json({ message: "No active cycle. Please initiate a cycle first." });
    const rc = await RecruitmentCycle.findOne({
      where: { cycle: hodCycle.cycle }
    });

    if (rc?.isFrozen) {
      return res.status(403).json({
        message: "Cycle is frozen. Cannot add experts.",
      });
    }

    const expert = await Expert.create({
      ...req.body,
      department: req.body.department.toUpperCase(),
      cycle: hodCycle.cycle,
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
  const hodCycle = await getCurrentCycle(req.user.id);
  if (!hodCycle) return res.status(400).json({ message: "No active cycle. Please initiate a cycle first." });
  const experts = await Expert.findAll({
    where: {
      cycle: hodCycle.cycle,
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
    const hodCycle = await getCurrentCycle(req.user.id);
    if (!hodCycle) return res.status(400).json({ message: "No active cycle. Please initiate a cycle first." });
    const rc = await RecruitmentCycle.findOne({
      where: { cycle: hodCycle.cycle }
    });

    if (rc?.isFrozen) {
      return res.status(403).json({
        message: "Cycle is frozen. Cannot delete experts.",
      });
    }

    await Expert.destroy({
      where: { cycle: hodCycle.cycle }
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
  const hodCycle = await getCurrentCycle(req.user.id);
  
  // ✅ Check FIRST before using it
  if (!hodCycle) return res.json({ candidates: 0, experts: 0 }); // ← return 0s not 400

  const cycleStr = hodCycle.cycle;
  const candidateCount = await Candidate.count({ where: { cycle: cycleStr, hodId: req.user.id } });
  const expertCount    = await Expert.count({    where: { cycle: cycleStr, uploadedById: req.user.id } });
  res.json({ candidates: candidateCount, experts: expertCount });
};

/* =========================================================
   GET ALL EXPERTS (DOFA)
========================================================= */
// ADD to hod.controller.js — replaces the router block above
exports.getAllExperts = async (req, res) => {
  try {
    const { Expert, User } = require("../models");
    const experts = await Expert.findAll({
      include: [{ model: User, as: "uploadedBy", attributes: ["department", "name"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(experts);
  } catch (err) {
    res.status(500).json({ message: "Failed" });
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
    const hodCycle = await getCurrentCycle(hodId);
    if (!hodCycle) return res.status(200).json({ candidates: 0, experts: 0 });
    const formattedExperts = experts.map(row => ({
      cycle: hodCycle.cycle,
      fullName: row["Full Name (with Salutation)"]?.trim(),
      designation: row["Designation"]?.trim(),
      department: row["Department"]?.trim()?.toUpperCase(),
      institute: row["Institute"]?.trim(),
      email: row["Email"]?.trim()?.toLowerCase(),
      specialization: row["Specialization"]?.trim(),
      mobileNo: row["Mobile No. (Optional)"]?.trim() || null,
      uploadedById: hodId
    }));

    // insertMany → bulkCreate
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

exports.getHodLogs = async (req, res) => {
  try {
    const hodId = req.user.id;
    const { Op } = require("sequelize");

    // ← Fix: match cycles that are closed OR joining complete (not just status="CLOSED")
    const cycles = await RecruitmentCycle.findAll({
      where: {
        hodId,
        [Op.or]: [
          { isClosed: true },
          { joiningComplete: true },
          { status: "CLOSED" },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    const logs = await Promise.all(cycles.map(async (rc) => {
      const [candidates, experts] = await Promise.all([
        Candidate.findAll({ where: { cycle: rc.cycle, hodId } }),
        Expert.findAll({ where: { cycle: rc.cycle, uploadedById: hodId } }),
      ]);
      return {
        id:           rc.id,
        academicYear: rc.academicYear,
        cycleNumber:  rc.cycleNumber,
        cycle:        rc.cycle,
        status:       rc.status,
        isClosed:     rc.isClosed,
        joiningComplete: rc.joiningComplete,
        candidates,
        experts,
      };
    }));

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};