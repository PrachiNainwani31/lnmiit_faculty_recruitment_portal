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

router.get("/current",        auth(["HoD","DoFA","ADoFA","ADMIN","DoFA_OFFICE"]), getCurrentCycle);
router.post("/submit",        auth(["HoD"]),                        submitToDofa);
router.post("/query",         auth(["DoFA","ADoFA"]),               raiseQuery);
router.post("/approve",       auth(["DoFA","ADoFA"]),               approveCycle);
router.get("/dofa-dashboard", auth(["DoFA","ADoFA","DoFA_OFFICE"]), getDofaDashboard);
router.get("/dofa-office-dashboard", auth(["DoFA_OFFICE","DoFA","ADoFA"]), getDofaOfficeDashboard);

// ── NEW: DoFA sets teaching-interaction + interview dates ──────────────
// Body: { hodId, teachingInteractionDate: "YYYY-MM-DD", interviewDate: "YYYY-MM-DD" }
// Setting interviewDate unlocks HoD's "Mark Appeared" toggle
router.post("/set-dates",     auth(["DoFA","ADoFA"]),               setInterviewDates);
router.post("/submit-appeared", auth(["HoD"]),                        submitAppearedToDofa);
router.post("/initiate", auth(["HoD"]), initiateCycle);
router.get("/next-cycle-number", auth(["HoD"]), getNextCycleNumber);

module.exports = router;