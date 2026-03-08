const express = require("express");
const auth = require("../middlewares/auth");
const {
  emailAllCandidates,
  emailCandidate,
  emailAllExperts,
  notifyDofaUpload
} = require("../controllers/email.controller");

const router = express.Router();

router.post("/candidates/:id", auth(["DOFA"]), emailCandidate);
router.post("/candidates/department/:dept", auth(["DOFA"]), emailAllCandidates);
router.post("/experts/hod/:hodId", auth(["DOFA"]), emailAllExperts);
router.post("/notify-dofa", auth(["HOD"]), notifyDofaUpload);

module.exports = router;
