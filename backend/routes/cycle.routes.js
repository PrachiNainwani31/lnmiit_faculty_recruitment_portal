const express = require("express");
const {
  getCurrentCycle,
  submitToDofa,
  raiseQuery,
  approveCycle,getDofaDashboard
} = require("../controllers/cycle.controller");

const auth  = require("../middlewares/auth");

const router = express.Router();

/**
 * Get current recruitment cycle
 * Accessible by all logged-in users
 */
router.get(
  "/current",
  auth(["HOD", "DOFA", "ADOFA", "ADMIN"]),
  getCurrentCycle
);

/**
 * HoD submits data to DoFA (freeze cycle)
 * ONLY HoD allowed
 */
router.post(
  "/submit",
  auth(["HOD"]),
  submitToDofa
);

/**
 * DoFA raises query to HoD
 * ONLY DOFA / ADOFA allowed
 */
router.post(
  "/query",
  auth(["DOFA", "ADOFA"]),
  raiseQuery
);

/**
 * DoFA approves recruitment cycle
 * ONLY DOFA / ADOFA allowed
 */
router.post(
  "/approve",
  auth(["DOFA", "ADOFA"]),
  approveCycle
);

router.get(
  "/dofa-dashboard",
  auth(["DOFA"]),
  getDofaDashboard
);

module.exports = router;
