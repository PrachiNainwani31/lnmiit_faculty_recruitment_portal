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

router.get("/candidates/template/:cycle", auth(["HoD"]), downloadTemplate);

router.post("/candidates/stats",  auth(["HoD"]), saveCandidateStats);
router.get("/candidates/stats/",  auth(["HoD"]), getCandidateStats);
router.get("/candidates/status/", auth(["HoD"]), getCandidateStatus);

router.post(
  "/candidates/upload",
  auth(["HoD"]),
  freezeGuard,
  upload.single("file"),
  uploadCandidates
);

router.post(
  "/candidates/resumes",
  auth(["HoD"]),
  freezeGuard,
  resumeUpload.single("zip"),
  uploadResumes
);

router.get("/candidates/resumes", auth(["HoD"]), getUploadedResumes);

router.delete(
  "/candidates/resumes/:filename",
  auth(["HoD"]),
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
  auth(["HoD"]),
  markAppeared
);

router.get(
  "/candidates/department/:department",
  auth(["DoFA"]),
  getCandidatesByDepartment
);

router.delete("/candidates/clear/:cycle", auth(["HoD"]), freezeGuard, clearCandidateStats);
router.delete("/candidates/:id",          auth(["HoD"]), freezeGuard, deleteCandidate);

router.get(
  "/candidates",
  auth(["DoFA", "DoFA_OFFICE"]),
  getCandidatesByCycle
);

router.get("/candidates/:cycle", auth(["HoD", "DoFA", "DoFA_OFFICE"]), getCandidatesByCycle);

/* =========================
   EXPERTS
========================= */
router.get("/experts/all",      auth(["DoFA", "ADoFA", "DoFA_OFFICE"]), getAllExperts);
router.get("/experts",          auth(["HoD", "DoFA", "ADoFA", "DoFA_OFFICE"]), getExperts);
router.delete("/experts/clear", auth(["HoD"]), freezeGuard, clearExperts);

/* =========================
   DASHBOARD / SUBMIT
========================= */
router.get("/counts",  auth(["HoD"]), getHodCounts);
router.post("/submit", auth(["HoD"]), freezeGuard, submitToDofa);

// DEV ONLY
router.post("/unfreeze", unfreezeCycle);

/* =========================
   EXPERTS CSV UPLOAD — HoD
========================= */
router.post(
  "/upload-experts",
  auth(["HoD"]),
  freezeGuard,
  upload.single("file"),
  uploadExpertsCSV
);

/* =========================
   EXPERTS CSV UPLOAD — DoFA (uploads for a specific HoD's cycle)
   Body must include hodId to identify which cycle to upload into.
========================= */
router.post(
  "/upload-experts-for-hod",
  auth(["DoFA", "ADoFA"]),
  upload.single("file"),
  uploadExpertsCSVForHod
);

router.get("/logs", auth(["HoD"]), getHodLogs);
router.get("/experts/by-hod/:hodId", auth(["DoFA", "ADoFA", "DoFA_OFFICE"]), getExpertsByHod);

module.exports = router;