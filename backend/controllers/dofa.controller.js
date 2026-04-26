const path = require("path");
const fs = require("fs");
const getCurrentCycle = require("../utils/getCurrentCycle");

exports.downloadDepartmentResumes = async (req, res) => {
  try {
    const { User, RecruitmentCycle } = require("../models");
    const department = req.params.department.toUpperCase();

    const hod = await User.findOne({ where: { role: "HoD", department } });
    if (!hod) return res.status(404).json({ message: "No HoD found for department" });

    const latestCycle = await RecruitmentCycle.findOne({
      where: { hodId: hod.id },
      order: [["createdAt", "DESC"]],
    });
    if (!latestCycle) return res.status(404).json({ message: "No cycle found" });

    // Use DB path directly
    if (!latestCycle.resumesZip) {
      return res.status(404).json({ message: "No resumes uploaded for this department" });
    }

    const filePath = path.resolve(__dirname, "..", latestCycle.resumesZip);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Resume file not found on server" });
    }

    res.download(filePath, `${department}_resumes_${latestCycle.cycle}.zip`);
  } catch (err) {
    console.error("downloadDepartmentResumes error:", err);
    res.status(500).json({ message: "Failed to download resumes" });
  }
};