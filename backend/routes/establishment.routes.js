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
} = require("../controllers/establishment.controller");

router.get("/records",         auth(["ESTABLISHMENT","DOFA","ADOFA","DOFA_OFFICE","HOD","ESTATE","LUCS"]), getOnboardingRecords);
router.post("/offer-letter",   auth(["ESTABLISHMENT"]), upload.single("pdf"), uploadOfferLetter);
router.post("/joining-date",   auth(["ESTABLISHMENT"]), setJoiningDate);
router.post("/joining-letter", auth(["ESTABLISHMENT"]), upload.single("pdf"), uploadJoiningLetter);
router.post("/allot-room",     auth(["DOFA_OFFICE"]),   allotRoom);

module.exports = router;