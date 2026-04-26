// routes/interviewLog.routes.js
const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const {
  getLogs,
  saveLog,
  exportLogs,
} = require("../controllers/interviewLog.controller");

const DoFA_OFFICE_ROLES = ["DoFA","ADoFA","DoFA_OFFICE"];

router.get("/",       auth(DoFA_OFFICE_ROLES), getLogs);
router.post("/",      auth(DoFA_OFFICE_ROLES), saveLog);
router.get("/export", auth(DoFA_OFFICE_ROLES), exportLogs);

module.exports = router;
