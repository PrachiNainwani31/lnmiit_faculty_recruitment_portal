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
  const {addExpert,
  getExperts,
  clearExperts,
  getHodCounts,
  getAllExperts,
  uploadExpertsCSV,
  getHodLogs,
  getExpertsByHod,
  uploadExpertsCSVForHod
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

router.get("/candidates/template/:cycle", auth(["HOD"]), downloadTemplate);

router.post("/candidates/stats",  auth(["HOD"]), saveCandidateStats);
router.get("/candidates/stats/",  auth(["HOD"]), getCandidateStats);
router.get("/candidates/status/", auth(["HOD"]), getCandidateStatus);

router.post(
  "/candidates/upload",
  auth(["HOD"]),
  freezeGuard,
  upload.single("file"),
  uploadCandidates
);

router.post(
  "/candidates/resumes",
  auth(["HOD"]),
  freezeGuard,
  resumeUpload.single("zip"),
  uploadResumes
);

router.get("/candidates/resumes", auth(["HOD"]), getUploadedResumes);

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

router.patch(
  "/candidates/appeared/:id",
  auth(["HOD"]),
  markAppeared
);

router.get(
  "/candidates/department/:department",
  auth(["DOFA"]),
  getCandidatesByDepartment
);

router.delete("/candidates/clear/:cycle", auth(["HOD"]), freezeGuard, clearCandidateStats);
router.delete("/candidates/:id",          auth(["HOD"]), freezeGuard, deleteCandidate);

router.get(
  "/candidates",
  auth(["DOFA", "DOFA_OFFICE"]),
  getCandidatesByCycle
);

router.get("/candidates/:cycle", auth(["HOD", "DOFA", "DOFA_OFFICE"]), getCandidatesByCycle);

/* =========================
   EXPERTS
========================= */
router.get("/experts/all",      auth(["DOFA", "ADOFA", "DOFA_OFFICE"]), getAllExperts);
router.get("/experts",          auth(["HOD", "DOFA", "ADOFA", "DOFA_OFFICE"]), getExperts);
router.delete("/experts/clear", auth(["HOD"]), freezeGuard, clearExperts);

/* =========================
   DASHBOARD / SUBMIT
========================= */
router.get("/counts",  auth(["HOD"]), getHodCounts);
router.post("/submit", auth(["HOD"]), freezeGuard, submitToDofa);

// DEV ONLY
router.post("/unfreeze", unfreezeCycle);

/* =========================
   EXPERTS CSV UPLOAD — HOD
========================= */
router.post(
  "/upload-experts",
  auth(["HOD"]),
  freezeGuard,
  upload.single("file"),
  uploadExpertsCSV
);

/* =========================
   EXPERTS CSV UPLOAD — DOFA (uploads for a specific HOD's cycle)
   Body must include hodId to identify which cycle to upload into.
========================= */
router.post(
  "/upload-experts-for-hod",
  auth(["DOFA", "ADOFA"]),
  upload.single("file"),
  uploadExpertsCSVForHod
);

router.get("/logs", auth(["HOD"]), getHodLogs);
router.get("/experts/by-hod/:hodId", auth(["DOFA", "ADOFA", "DOFA_OFFICE"]), getExpertsByHod);

module.exports = router;