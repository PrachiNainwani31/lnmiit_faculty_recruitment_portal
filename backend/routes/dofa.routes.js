// REPLACE your entire router file with this:
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { downloadDepartmentResumes } = require("../controllers/dofa.controller");
const CandidateApplication = require("../models/CandidateApplication");
const {
  getDocumentTracking,
  updateDocumentVerdict,
  sendReminder,
  downloadCandidateDocs,
  downloadByCandidate,
  getClosedCycleDocs,
} = require("../controllers/dofaDocument.controller");

const DoFA_ROLES = ["DoFA", "ADoFA", "DoFA_OFFICE"];   // ← shared shorthand

router.get("/resumes/:department", auth(["DoFA","ADoFA"]), downloadDepartmentResumes);

router.get("/documents", auth(DoFA_ROLES), async (req, res) => {
  const apps = await CandidateApplication
    .find()
    .populate("candidate", "name email department");
  res.json(apps);
});

router.get("/document-tracking",      auth(DoFA_ROLES), getDocumentTracking);
router.post("/document-verdict",       auth(DoFA_ROLES), updateDocumentVerdict);
router.post("/document-reminder",      auth(DoFA_ROLES), sendReminder);
router.get("/candidate-docs/:appId/download",                    auth(DoFA_ROLES), downloadCandidateDocs);
router.get("/candidate-docs/:candidateId/download-by-candidate", auth(DoFA_ROLES), downloadByCandidate);
router.get("/closed-cycle-docs",       auth(DoFA_ROLES), getClosedCycleDocs);   // ← ADD THIS

module.exports = router;