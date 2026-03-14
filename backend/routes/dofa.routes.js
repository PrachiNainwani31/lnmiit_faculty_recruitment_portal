const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { downloadDepartmentResumes } = require("../controllers/dofa.controller");
const CandidateApplication = require("../models/CandidateApplication");
const {
getDocumentTracking,
updateDocumentVerdict,
sendReminder
}=require("../controllers/dofaDocument.controller")

router.get(
  "/resumes/:department",
  auth(["DOFA"]),
  downloadDepartmentResumes
);

router.get("/documents", auth(["DOFA"]), async (req, res) => {

  const apps = await CandidateApplication
    .find()
    .populate("candidate", "name email department");

  res.json(apps);

});

router.get("/document-tracking",auth(["DOFA"]),getDocumentTracking)
router.post("/document-verdict",auth(["DOFA"]),updateDocumentVerdict)
router.post("/document-reminder",auth(["DOFA"]),sendReminder)
module.exports = router;
