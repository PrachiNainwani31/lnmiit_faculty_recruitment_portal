const express = require("express");
const router = express.Router();

const freezeGuard   = require("../middlewares/freezeGuard");
const resumeUpload  = require("../middlewares/resumeUpload");
const auth          = require("../middlewares/auth");
const upload        = require("../middlewares/csvUpload");
const fs            = require("fs");
const path          = require("path");

const {
  addExpert,
  getExperts,
  clearExperts,
  getHodCounts,
  getAllExperts,
  uploadExpertsCSV,
} = require("../controllers/hod.controller");

const { submitToDofa } = require("../controllers/cycle.controller");

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
  markAppeared,           // ← NEW
} = require("../controllers/candidateController");

const { unfreezeCycle } = require("../controllers/cycle.controller");

/* =========================
   CANDIDATES
========================= */

// CSV template (KEEP FIRST — exact path match before :cycle param)
router.get("/candidates/template/:cycle", downloadTemplate);

// Stats & status
router.post("/candidates/stats",   auth(["HOD"]), saveCandidateStats);
router.get("/candidates/stats/",   auth(["HOD"]), getCandidateStats);
router.get("/candidates/status/",  auth(["HOD"]), getCandidateStatus);

// Upload CSV
router.post(
  "/candidates/upload",
  auth(["HOD"]),
  freezeGuard,
  upload.single("file"),
  uploadCandidates
);

// Upload ALL resumes (ZIP)
router.post(
  "/candidates/resumes",
  auth(["HOD"]),
  freezeGuard,
  resumeUpload.single("zip"),
  uploadResumes
);

// ── NEW: Mark / unmark a candidate as appeared ──────────────────────
// HOD calls PATCH /hod/candidates/appeared/:id  { appeared: true/false }
// Result is visible on DOFA page and DOFA Office page
router.patch(
  "/candidates/appeared/:id",
  auth(["HOD"]),
  markAppeared
);

// Delete / clear
router.delete("/candidates/clear/:cycle", auth(["HOD"]), freezeGuard, clearCandidateStats);
router.delete("/candidates/:id",          auth(["HOD"]), freezeGuard, deleteCandidate);

// By department (DOFA)
router.get(
  "/candidates/department/:department",
  auth(["DOFA"]),
  getCandidatesByDepartment
);

// By cycle (HOD, DOFA, DOFA_OFFICE)
router.get("/candidates/:cycle", auth(["HOD", "DOFA", "DOFA_OFFICE"]), getCandidatesByCycle);

/* =========================
   EXPERTS
========================= */
router.get("/experts/all", auth(["DOFA", "DOFA_OFFICE"]), getAllExperts);
router.get("/experts",     auth(["HOD", "DOFA", "DOFA_OFFICE"]), getExperts);
router.delete("/experts/clear", auth(["HOD"]), freezeGuard, clearExperts);

/* =========================
   DASHBOARD / SUBMIT
========================= */
router.get("/counts",   auth(["HOD"]), getHodCounts);
router.post("/submit",  auth(["HOD"]), freezeGuard, submitToDofa);

// DEV ONLY
router.post("/unfreeze", unfreezeCycle);

/* =========================
   RESUMES (per file delete)
========================= */
router.delete(
  "/candidates/resumes/:filename",
  auth(["HOD"]),
  freezeGuard,
  async (req, res) => {
    const filePath = path.join(
      __dirname,
      "../uploads/resumes",
      req.user.id.toString(),
      req.params.filename
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true });
  }
);

router.get("/candidates/resumes", auth(["HOD"]), getUploadedResumes);

/* =========================
   EXPERTS CSV UPLOAD
========================= */
router.post(
  "/upload-experts",
  auth(["HOD"]),
  freezeGuard,
  upload.single("file"),
  uploadExpertsCSV
);

module.exports = router;