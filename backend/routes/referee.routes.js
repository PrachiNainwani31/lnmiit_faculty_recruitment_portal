const express  = require("express");
const router   = express.Router();
const auth     = require("../middlewares/auth");
const upload   = require("../middlewares/documentUpload");

const {
  getRefereeInfo,
  uploadReferenceLetter,
  getRefereeStatus,
  sendRefereeReminder,
  verifyCaptcha,
} = require("../controllers/referee_controller");

/* ─────────────────────────────────────────────
   PUBLIC routes — no auth needed
   (referee accesses via emailed link)
───────────────────────────────────────────── */

// Referee opens their portal link → get candidate name & their own info
router.get("/info/:refereeId", getRefereeInfo);

// Referee uploads their letter (PDF) + signs with full name
router.post(
  "/upload/:refereeId",
  upload.single("letter"),
  uploadReferenceLetter
);

// Candidate checks status of all their referees
router.get("/status", auth(["CANDIDATE"]), getRefereeStatus);

// Candidate sends a reminder to a specific referee
router.post(
  "/remind/:refereeId",
  auth(["CANDIDATE"]),
  sendRefereeReminder
);

router.post("/verify-captcha", verifyCaptcha);

module.exports = router;