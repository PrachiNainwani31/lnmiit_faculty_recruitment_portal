const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const upload  = require("../middlewares/documentUpload");

const {
  getAllExpertTravel,
  saveConfirmation,
  submitQuote,
  approveQuote,
  uploadTicket,
  uploadInvoice,
  savePickupDrop,
  saveDriverInfo,
} = require("../controllers/Experttravel.controller");

const DOFA_OFFICE   = ["DOFA_OFFICE"];
const DOFA_ROLES    = ["DOFA", "ADOFA"];
const TRAVEL = ["TRAVEL"];
const ALL_TRAVEL    = ["DOFA_OFFICE", "DOFA", "ADOFA", "TRAVEL"];

// Get all experts with travel status
router.get("/", auth(ALL_TRAVEL), getAllExpertTravel);

// DOFA Office saves confirmation + travel details
router.post("/confirm/:expertId", auth(DOFA_OFFICE), saveConfirmation);

// Ramswaroop submits quote
router.post("/quote/:expertId", auth(TRAVEL), submitQuote);

// DOFA/ADoFA approves or rejects quote
router.post("/quote/:expertId/approve", auth(DOFA_ROLES), approveQuote);

// Ramswaroop uploads ticket
router.post("/ticket/:expertId", auth(TRAVEL), upload.single("ticket"), uploadTicket);

// Ramswaroop uploads invoice
router.post("/invoice/:expertId", auth(TRAVEL), upload.single("invoice"), uploadInvoice);

// DOFA Office enters pickup/drop
router.post("/pickup/:expertId", auth(DOFA_OFFICE), savePickupDrop);

// Ramswaroop enters driver info
router.post("/driver/:expertId", auth(TRAVEL), saveDriverInfo);

module.exports = router;