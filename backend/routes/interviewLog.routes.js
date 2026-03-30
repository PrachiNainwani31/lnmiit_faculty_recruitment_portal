// routes/interviewLog.routes.js
const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const {
  getLogs,
  saveLog,
  exportLogs,
} = require("../controllers/interviewLog.controller");

const DOFA_OFFICE_ROLES = ["DOFA","ADOFA","DOFA_OFFICE"];

router.get("/",       auth(DOFA_OFFICE_ROLES), getLogs);
router.post("/",      auth(DOFA_OFFICE_ROLES), saveLog);
router.get("/export", auth(DOFA_OFFICE_ROLES), exportLogs);

module.exports = router;

// ─────────────────────────────────────────────────────────────────────────────
// ADD THIS LINE TO server.js (after the other app.use lines):
//
//   app.use("/api/interview-logs", require("./routes/interviewLog.routes"));
//
// ─────────────────────────────────────────────────────────────────────────────