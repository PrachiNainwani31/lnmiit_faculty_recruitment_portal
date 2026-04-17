// routes/cycle.routes.js
const express = require("express");
const {
  getCurrentCycle,
  submitToDofa,
  raiseQuery,
  approveCycle,
  getDofaOfficeDashboard,
  getDofaDashboard,
  setInterviewDates,  
  submitAppearedToDofa,
  initiateCycle,
  getNextCycleNumber,
} = require("../controllers/cycle.controller");

const auth   = require("../middlewares/auth");
const router = express.Router();

router.get("/current",        auth(["HOD","DOFA","ADOFA","ADMIN","DOFA_OFFICE"]), getCurrentCycle);
router.post("/submit",        auth(["HOD"]),                        submitToDofa);
router.post("/query",         auth(["DOFA","ADOFA"]),               raiseQuery);
router.post("/approve",       auth(["DOFA","ADOFA"]),               approveCycle);
router.get("/dofa-dashboard", auth(["DOFA","ADOFA","DOFA_OFFICE"]), getDofaDashboard);
router.get("/dofa-office-dashboard", auth(["DOFA_OFFICE","DOFA","ADOFA"]), getDofaOfficeDashboard);

// ── NEW: DOFA sets teaching-interaction + interview dates ──────────────
// Body: { hodId, teachingInteractionDate: "YYYY-MM-DD", interviewDate: "YYYY-MM-DD" }
// Setting interviewDate unlocks HOD's "Mark Appeared" toggle
router.post("/set-dates",     auth(["DOFA","ADOFA"]),               setInterviewDates);
router.post("/submit-appeared", auth(["HOD"]),                        submitAppearedToDofa);
router.post("/initiate", auth(["HOD"]), initiateCycle);
router.get("/next-cycle-number", auth(["HOD"]), getNextCycleNumber);

module.exports = router;