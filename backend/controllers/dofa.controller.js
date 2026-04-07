const path = require("path");
const fs = require("fs");
const getCurrentCycle = require("../utils/getCurrentCycle");

exports.downloadDepartmentResumes = async (req, res) => {
  const department = req.params.department.toUpperCase();
  const hod = await User.findOne({ where: { role: "HOD", department } });
  if (!hod) return res.status(404).json({ message: "No HOD found for department" });

    const cycle = await getCurrentCycle(hod.id);
    if (!cycle) return res.status(404).json({ message: "No active cycle for this department" });
  const filePath = path.join(
    __dirname,
    "../uploads/resumes",
    cycle.cycle,
    department,
    "resumes.zip"
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      message: "No resumes uploaded for this department",
    });
  }

  res.download(filePath, `${department}_resumes_${CYCLE}.zip`);
};