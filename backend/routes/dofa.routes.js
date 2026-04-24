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

const DOFA_ROLES = ["DOFA", "ADOFA", "DOFA_OFFICE"];   // ← shared shorthand

router.get("/resumes/:department", auth(["DOFA","ADOFA"]), downloadDepartmentResumes);

router.get("/documents", auth(DOFA_ROLES), async (req, res) => {
  const apps = await CandidateApplication
    .find()
    .populate("candidate", "name email department");
  res.json(apps);
});

router.get("/document-tracking",      auth(DOFA_ROLES), getDocumentTracking);
router.post("/document-verdict",       auth(DOFA_ROLES), updateDocumentVerdict);
router.post("/document-reminder",      auth(DOFA_ROLES), sendReminder);
router.get("/candidate-docs/:appId/download",                    auth(DOFA_ROLES), downloadCandidateDocs);
router.get("/candidate-docs/:candidateId/download-by-candidate", auth(DOFA_ROLES), downloadByCandidate);
router.get("/closed-cycle-docs",       auth(DOFA_ROLES), getClosedCycleDocs);   // ← ADD THIS

module.exports = router;