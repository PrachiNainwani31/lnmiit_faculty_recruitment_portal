const multer = require("multer");
const path   = require("path");
const fs     = require("fs");
const getCurrentCycle = require("../utils/getCurrentCycle");

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      // ✅ Get cycle dynamically from HOD's current cycle
      const cycleDoc   = await getCurrentCycle(req.user.id);
      const cycleStr   = cycleDoc?.cycle || "unknown-cycle";
      const department = req.user.department || "unknown-dept";

      const uploadPath = path.join(
        __dirname, "../uploads/resumes", cycleStr, department
      );
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    cb(null, "resumes.zip");
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith(".zip"))
      return cb(new Error("Only ZIP files allowed"));
    cb(null, true);
  },
});

module.exports = upload;