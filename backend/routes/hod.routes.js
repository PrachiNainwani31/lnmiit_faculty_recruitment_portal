const express = require("express");
const router = express.Router();

const freezeGuard = require("../middlewares/freezeGuard");
const resumeUpload = require("../middlewares/resumeUpload");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/csvUpload");
const fs = require("fs");
const path = require("path");

const {
  addExpert,
  getExperts,
  clearExperts,
  getHodCounts,
  getAllExperts,
  uploadExpertsCSV
} = require("../controllers/hod.controller");
const {submitToDofa}=require("../controllers/cycle.controller");
const {
  uploadCandidates,
  deleteCandidate,
  saveCandidateStats,
  getCandidateStats,
  clearCandidateStats,
  getCandidateStatus,
  getCandidatesByCycle,
  downloadTemplate,
  uploadResumes,
  getCandidatesByDepartment,
  getUploadedResumes,
} = require("../controllers/candidateController");

const { unfreezeCycle } = require("../controllers/cycle.controller");

/* =========================
   CANDIDATES
========================= */

// CSV template (KEEP FIRST)
router.get("/candidates/template/:cycle", downloadTemplate);

// Stats & status
router.post("/candidates/stats", auth(["HOD"]), saveCandidateStats);
router.get("/candidates/stats/:cycle", auth(["HOD"]),getCandidateStats);
router.get("/candidates/status/:cycle", auth(["HOD"]),getCandidateStatus);

// Upload CSV
router.post(
  "/candidates/upload",
  auth(["HOD"]),
  freezeGuard,
  upload.single("file"),
  uploadCandidates
);

// Upload ALL resumes together (HOD)
router.post(
  "/candidates/resumes",
  auth(["HOD"]),
  freezeGuard,
  resumeUpload.single("zip"),
  uploadResumes
);

// Delete / clear
router.delete("/candidates/clear/:cycle",auth(["HOD"]), freezeGuard, clearCandidateStats);
router.delete("/candidates/:id", auth(["HOD"]),freezeGuard, deleteCandidate);

// ⚠️ MUST BE LAST
router.get("/candidates/:cycle",auth(["HOD","DOFA"]), getCandidatesByCycle);

/* =========================
   DOFA – VIEW BY DEPARTMENT
========================= */

router.get(
  "/candidates/department/:department",
  auth(["DOFA"]),
  getCandidatesByDepartment
);

/* =========================
   EXPERTS
========================= */

router.post("/experts", auth(["HOD"]),freezeGuard, addExpert);
// DOFA – ALL EXPERTS
router.get("/experts/all",auth(["DOFA"]),getAllExperts);
router.get("/experts", auth(["HOD","DOFA"]),getExperts);
router.delete("/experts/clear",auth(["HOD"]),freezeGuard,clearExperts);

/* =========================
   DASHBOARD / FINAL SUBMIT
========================= */

router.get("/counts", auth(["HOD"]),getHodCounts);
router.post("/submit",auth(["HOD"]), freezeGuard,submitToDofa);

// DEV ONLY
router.post("/unfreeze", unfreezeCycle);
/* DELETE single resume */
router.delete(
  "/candidates/resumes/:filename",
  auth(["HOD"]),freezeGuard,
  async (req, res) => {
    const filePath = path.join(
      __dirname,
      "../uploads/resumes",
      req.user._id.toString(),
      req.params.filename
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true });
  }
);
router.get(
  "/candidates/resumes",
  auth(["HOD"]),
  getUploadedResumes
);

router.post(
  "/upload-experts",
  auth(["HOD"]),
  freezeGuard,
  upload.single("file"),
  uploadExpertsCSV
);

module.exports = router;
