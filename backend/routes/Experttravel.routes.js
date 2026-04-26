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
  getClosedCycleTravel
} = require("../controllers/Experttravel.controller");

const DoFA_OFFICE   = ["DoFA_OFFICE"];
const DoFA_ROLES    = ["DoFA", "ADoFA"];
const REGISTRAR_OFFICE = ["REGISTRAR_OFFICE"];
const ALL_REGISTRAR_OFFICE    = ["DoFA_OFFICE", "DoFA", "ADoFA", "REGISTRAR_OFFICE"];

// Get all experts with REGISTRAR_OFFICE status
router.get("/closed", auth([...DoFA_ROLES, ...DoFA_OFFICE]), getClosedCycleTravel);
router.get("/", auth(ALL_REGISTRAR_OFFICE), getAllExpertTravel);

// DoFA Office saves confirmation + REGISTRAR_OFFICE details
router.post("/confirm/:expertId", auth(DoFA_OFFICE), saveConfirmation);

// Ramswaroop submits quote
router.post("/quote/:expertId", auth(REGISTRAR_OFFICE), submitQuote);

// DoFA/ADoFA approves or rejects quote
router.post("/quote/:expertId/approve", auth(DoFA_ROLES), approveQuote);

// Ramswaroop uploads ticket
router.post("/ticket/:expertId", auth(REGISTRAR_OFFICE), upload.single("ticket"), uploadTicket);

// Ramswaroop uploads invoice
router.post("/invoice/:expertId", auth(REGISTRAR_OFFICE), upload.single("invoice"), uploadInvoice);

// DoFA Office enters pickup/drop
router.post("/pickup/:expertId", auth(DoFA_OFFICE), savePickupDrop);

// Ramswaroop enters driver info
router.post("/driver/:expertId", auth(REGISTRAR_OFFICE), saveDriverInfo);

module.exports = router;