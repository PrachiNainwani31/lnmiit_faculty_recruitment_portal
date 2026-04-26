const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const {
  getSelectedCandidates,
  getAllCandidatesForLogs,
  publishSelection,
  markInterviewComplete,
  addManualExpert,
  getAllCandidatesLogs,
} = require("../controllers/SelectedCandidates.controller");

router.get("/",                    auth(["DoFA","ADoFA","DoFA_OFFICE","HoD","ESTABLISHMENT"]), getSelectedCandidates);
router.get("/logs/all",            auth(["DoFA","ADoFA","DoFA_OFFICE"]), getAllCandidatesLogs);
router.post("/publish",            auth(["DoFA_OFFICE"]), publishSelection);
router.post("/interview-complete", auth(["DoFA_OFFICE"]), markInterviewComplete);
router.post("/manual-expert",      auth(["DoFA","ADoFA"]), addManualExpert);

module.exports = router;