const path = require("path");
const fs = require("fs");
const CYCLE = require("../config/activeCycle");

exports.downloadDepartmentResumes = async (req, res) => {
  const department = req.params.department.toUpperCase();

  const filePath = path.join(
    __dirname,
    "../uploads/resumes",
    CYCLE,
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