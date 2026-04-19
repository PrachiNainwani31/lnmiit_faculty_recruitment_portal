const path = require("path");
const fs = require("fs");
const getCurrentCycle = require("../utils/getCurrentCycle");

exports.downloadDepartmentResumes = async (req, res) => {
  try {
    const { User, RecruitmentCycle } = require("../models");
    const department = req.params.department.toUpperCase().replace(/\s+/g, "_");

    const hod = await User.findOne({ where: { role: "HOD", department: req.params.department.toUpperCase() } });
    if (!hod) return res.status(404).json({ message: "No HOD found for department" });

    const latestCycle = await RecruitmentCycle.findOne({
      where: { hodId: hod.id },
      order: [["createdAt", "DESC"]],
    });
    if (!latestCycle) return res.status(404).json({ message: "No active cycle for this department" });

    // ✅ Sanitize cycle string — colons and spaces break file paths
    const cycleFolder = latestCycle.cycle.replace(/[^a-zA-Z0-9_\-]/g, "_");

    const filePath = path.join(
      __dirname,
      "../uploads/resumes",
      cycleFolder,
      department,
      "resumes.zip"
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "No resumes uploaded for this department" });
    }

    res.download(filePath, `${department}_resumes_${latestCycle.cycle}.zip`);
  } catch (err) {
    console.error("downloadDepartmentResumes error:", err);
    res.status(500).json({ message: "Failed to download resumes" });
  }
};