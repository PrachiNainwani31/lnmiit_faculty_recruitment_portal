const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/candidatePortal.controller");
const upload = require("../middlewares/upload");
const SelectedCandidate = require("../models/SelectedCandidate");
const OnboardingRecord = require("../models/OnboardingRecord");

router.get("/me", auth(["CANDIDATE"]), controller.getMyApplication);

router.post("/save", auth(["CANDIDATE"]), controller.saveDraft);

router.post("/submit", auth(["CANDIDATE"]), controller.submitApplication);

router.post("/referee/reminder/:id", auth(["CANDIDATE"]), controller.remindReferee);
router.post("/upload",auth(["CANDIDATE"]),upload.single("file"),controller.uploadDocument);
router.get("/onboarding", auth(["CANDIDATE"]), async (req, res) => {
  try {
    const userEmail = req.user.email;

    const Candidate = require("../models/Candidate");
    const candidateDoc = await Candidate.findOne({ email: userEmail });

    if (!candidateDoc) {
      return res.json({ selected: false, record: null });
    }

    // Now query using the Candidate's _id
    const selected = await SelectedCandidate.findOne({
      candidate: candidateDoc._id
    }).populate("candidate");

    const record = await OnboardingRecord.findOne({
      candidate: candidateDoc._id
    }).populate("candidate");

    res.json({
      selected: !!selected,
      selectionStatus: selected?.status || null,
      department: record?.department || selected?.department || null,
      record: record || null
    });

  } catch (err) {
    console.error("ONBOARDING ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
module.exports = router;