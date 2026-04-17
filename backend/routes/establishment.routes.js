// routes/establishment.routes.js
const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const upload  = require("../middlewares/documentUpload");
const {
  getOnboardingRecords,
  uploadOfferLetter,
  setJoiningDate,
  uploadJoiningLetter,
  allotRoom,
  saveMisLibrary,     // NEW
  uploadRfidCard,     // NEW
  sendRfidToCandidate,// NEW
  markJoiningComplete,
  closeCycle,
  markNotJoined,
} = require("../controllers/establishment.controller");

router.get("/records",
  auth(["ESTABLISHMENT","DOFA","ADOFA","DOFA_OFFICE","HOD","ESTATE","LUCS"]),
  getOnboardingRecords);

router.post("/offer-letter",    auth(["ESTABLISHMENT"]), upload.single("pdf"), uploadOfferLetter);
router.post("/joining-date",    auth(["ESTABLISHMENT"]), setJoiningDate);
router.post("/joining-letter",  auth(["ESTABLISHMENT"]), upload.single("pdf"), uploadJoiningLetter);
router.post("/allot-room",      auth(["DOFA_OFFICE"]),   allotRoom);

router.post("/mis-library",     auth(["ESTABLISHMENT"]), saveMisLibrary);
router.post("/rfid-card",       auth(["ESTABLISHMENT"]), upload.single("pdf"), uploadRfidCard);
router.post("/rfid-send",       auth(["ESTABLISHMENT"]), sendRfidToCandidate);
router.post("/joining-complete", auth(["ESTABLISHMENT"]), markJoiningComplete);
router.post("/close-cycle", auth(["ESTABLISHMENT"]), closeCycle);
router.post("/not-joined", auth(["ESTABLISHMENT"]), markNotJoined);

module.exports = router;