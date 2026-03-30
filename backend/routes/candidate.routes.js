// routes/candidate.routes.js
const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const controller = require("../controllers/candidatePortal.controller");
const upload  = require("../middlewares/upload");
const SelectedCandidate = require("../models/SelectedCandidate");
const OnboardingRecord  = require("../models/OnboardingRecord");

router.get("/me",     auth(["CANDIDATE"]), controller.getMyApplication);
router.post("/save",  auth(["CANDIDATE"]), controller.saveDraft);
router.post("/submit",auth(["CANDIDATE"]), controller.submitApplication);

router.post("/referee/reminder/:id", auth(["CANDIDATE"]), controller.remindReferee);
router.post("/upload", auth(["CANDIDATE"]), upload.single("file"), controller.uploadDocument);

/* ── Onboarding status for candidate portal ──
   ✅ FIX: joiningLetterPath is STRIPPED — not visible to candidate.
   ✅ FIX: designation + employmentType added from SelectedCandidate.
   ✅ FIX: correct Sequelize where clause (candidateId not candidate).
   ✅ NEW: rfidPath + rfidSentToCandidate included for candidate download.
── */
router.get("/onboarding", auth(["CANDIDATE"]), async (req, res) => {
  try {
    const Candidate = require("../models/Candidate");
    const candidateDoc = await Candidate.findOne({ where: { email: req.user.email } });

    if (!candidateDoc) return res.json({ selected: false, record: null });

    // ✅ FIX: use candidateId (Sequelize FK column), not candidate
    const selected = await SelectedCandidate.findOne({
      where: { candidateId: candidateDoc.id },
    });

    const record = await OnboardingRecord.findOne({
      where: { candidateId: candidateDoc.id },
    });

    if (!selected || selected.status !== "SELECTED") {
      return res.json({ selected: false, record: null });
    }

    // ✅ Build safe record — strip joiningLetterPath entirely
    let safeRecord = null;
    if (record) {
      const raw = record.toJSON();
      // Remove joining letter — internal document, not for candidate view
      delete raw.joiningLetterPath;
      delete raw.joiningLetterUploadedAt;
      safeRecord = raw;
    }

    res.json({
      selected:        true,
      selectionStatus: selected.status,
      designation:     selected.designation     || null,
      employmentType:  selected.employmentType  || null,
      department:      record?.department       || selected.department || null,
      record:          safeRecord,
    });

  } catch (err) {
    console.error("ONBOARDING ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;