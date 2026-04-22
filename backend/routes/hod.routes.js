// routes/hod.routes.js
const express = require("express");
const router = express.Router();
const getCurrentCycle = require("../utils/getCurrentCycle");
const { RecruitmentCycle } = require("../models");
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
  getHodLogs,
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
  markAppeared,
} = require("../controllers/candidateController");

const { unfreezeCycle } = require("../controllers/cycle.controller");

/* =========================
   CANDIDATES
========================= */

// CSV template — must be before :cycle param route
router.get("/candidates/template/:cycle", auth(["HOD"]), downloadTemplate);

// Stats & status
router.post("/candidates/stats",  auth(["HOD"]), saveCandidateStats);
router.get("/candidates/stats/",  auth(["HOD"]), getCandidateStats);
router.get("/candidates/status/", auth(["HOD"]), getCandidateStatus);

// Upload CSV
router.post(
  "/candidates/upload",
  auth(["HOD"]),
  freezeGuard,
  upload.single("file"),
  uploadCandidates
);

// FIX: /resumes routes MUST come BEFORE /candidates/:cycle
// Otherwise Express matches :cycle="resumes" and calls getCandidatesByCycle instead
router.post(
  "/candidates/resumes",
  auth(["HOD"]),
  freezeGuard,
  resumeUpload.single("zip"),
  uploadResumes
);

router.get("/candidates/resumes", auth(["HOD"]), getUploadedResumes);

// Delete resume ZIP
router.delete(
  "/candidates/resumes/:filename",
  auth(["HOD"]),
  freezeGuard,
  async (req, res) => {
    try {
      const cycle = await getCurrentCycle(req.user.id);
      if (!cycle) return res.status(404).json({ message: "No active cycle" });

      if (cycle.resumesZip) {
        const filePath = path.resolve(__dirname, "..", cycle.resumesZip);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      // Clear from DB
      await RecruitmentCycle.update(
        { resumesZip: null },
        { where: { id: cycle.id } }
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Delete failed" });
    }
  }
);

// Mark appeared
router.patch(
  "/candidates/appeared/:id",
  auth(["HOD"]),
  markAppeared
);

// By department (DOFA) — specific route before :cycle
router.get(
  "/candidates/department/:department",
  auth(["DOFA"]),
  getCandidatesByDepartment
);

// Delete / clear
router.delete("/candidates/clear/:cycle", auth(["HOD"]), freezeGuard, clearCandidateStats);
router.delete("/candidates/:id",          auth(["HOD"]), freezeGuard, deleteCandidate);

router.get(
  "/candidates",
  auth(["DOFA", "DOFA_OFFICE"]),
  getCandidatesByCycle   // controller ignores cycle param for DOFA roles
);

// By cycle — MUST be LAST among /candidates/* routes
router.get("/candidates/:cycle", auth(["HOD", "DOFA", "DOFA_OFFICE"]), getCandidatesByCycle);

/* =========================
   EXPERTS
========================= */
router.get("/experts/all",     auth(["DOFA", "DOFA_OFFICE"]), getAllExperts);
router.get("/experts",         auth(["HOD", "DOFA", "DOFA_OFFICE"]), getExperts);
router.delete("/experts/clear",auth(["HOD"]), freezeGuard, clearExperts);

/* =========================
   DASHBOARD / SUBMIT
========================= */
router.get("/counts",  auth(["HOD"]), getHodCounts);
router.post("/submit", auth(["HOD"]), freezeGuard, submitToDofa);

// DEV ONLY
router.post("/unfreeze", unfreezeCycle);

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

router.get("/logs", auth(["HOD"]), getHodLogs);

module.exports = router;