const multer = require("multer");
const path = require("path");
const fs = require("fs");
const CYCLE = require("../config/activeCycle");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const department = req.user.department;

    const uploadPath = path.join(
      __dirname,
      "../uploads/resumes",
      CYCLE,
      department
    );
    console.log("Saving ZIP for department:", req.user.department);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, "resumes.zip");
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith(".zip")) {
      return cb(new Error("Only ZIP files allowed"));
    }
    cb(null, true);
  },
});

module.exports = upload;
