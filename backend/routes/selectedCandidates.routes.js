const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const {
  getSelectedCandidates,
  publishSelection,
  markInterviewComplete,
  addManualExpert,
} = require("../controllers/SelectedCandidates.controller");

router.get("/",                    auth(["DOFA","ADOFA","DOFA_OFFICE","HOD","ESTABLISHMENT"]), getSelectedCandidates);
router.post("/publish",            auth(["DOFA_OFFICE"]), publishSelection);
router.post("/interview-complete", auth(["DOFA_OFFICE"]), markInterviewComplete);
router.post("/manual-expert",      auth(["DOFA_OFFICE"]), addManualExpert);

module.exports = router;