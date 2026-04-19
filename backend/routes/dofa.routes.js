const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { downloadDepartmentResumes } = require("../controllers/dofa.controller");
const CandidateApplication = require("../models/CandidateApplication");
const {
getDocumentTracking,
updateDocumentVerdict,
sendReminder,
downloadCandidateDocs,downloadByCandidate,
}=require("../controllers/dofaDocument.controller")

router.get(
  "/resumes/:department",
  auth(["DOFA"]),
  downloadDepartmentResumes
);

router.get("/documents", auth(["DOFA","ADOFA"]), async (req, res) => {

  const apps = await CandidateApplication
    .find()
    .populate("candidate", "name email department");

  res.json(apps);

});

router.get("/document-tracking",auth(["DOFA","ADOFA","DOFA_OFFICE"]),getDocumentTracking)
router.post("/document-verdict",auth(["DOFA","ADOFA","DOFA_OFFICE"]),updateDocumentVerdict)
router.post("/document-reminder",auth(["DOFA","ADOFA","DOFA_OFFICE"]),sendReminder)
router.get("/candidate-docs/:appId/download",              auth(["DOFA","ADOFA","DOFA_OFFICE"]), downloadCandidateDocs);
router.get("/candidate-docs/:candidateId/download-by-candidate", auth(["DOFA","ADOFA","DOFA_OFFICE"]), downloadByCandidate);
module.exports = router;
