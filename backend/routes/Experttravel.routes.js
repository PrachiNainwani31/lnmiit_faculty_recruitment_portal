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
const REGISTRAR_OFFICE = ["REGISTRAR_OFFICE"];
const ALL_REGISTRAR_OFFICE    = ["DOFA_OFFICE", "DOFA", "ADOFA", "REGISTRAR_OFFICE"];

// Get all experts with REGISTRAR_OFFICE status
router.get("/", auth(ALL_REGISTRAR_OFFICE), getAllExpertTravel);

// DOFA Office saves confirmation + REGISTRAR_OFFICE details
router.post("/confirm/:expertId", auth(DOFA_OFFICE), saveConfirmation);

// Ramswaroop submits quote
router.post("/quote/:expertId", auth(REGISTRAR_OFFICE), submitQuote);

// DOFA/ADoFA approves or rejects quote
router.post("/quote/:expertId/approve", auth(DOFA_ROLES), approveQuote);

// Ramswaroop uploads ticket
router.post("/ticket/:expertId", auth(REGISTRAR_OFFICE), upload.single("ticket"), uploadTicket);

// Ramswaroop uploads invoice
router.post("/invoice/:expertId", auth(REGISTRAR_OFFICE), upload.single("invoice"), uploadInvoice);

// DOFA Office enters pickup/drop
router.post("/pickup/:expertId", auth(DOFA_OFFICE), savePickupDrop);

// Ramswaroop enters driver info
router.post("/driver/:expertId", auth(REGISTRAR_OFFICE), saveDriverInfo);

module.exports = router;