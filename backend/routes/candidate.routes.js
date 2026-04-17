const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const controller      = require("../controllers/candidatePortal.controller");
const documentUpload  = require("../middlewares/documentUpload");
const SelectedCandidate = require("../models/SelectedCandidate");
const OnboardingRecord  = require("../models/OnboardingRecord");
const deadlineGuard = require("../middlewares/deadlineGuard");

router.get("/me",      auth(["CANDIDATE"]), controller.getMyApplication);
router.post("/save",   auth(["CANDIDATE"]), deadlineGuard, controller.saveDraft);
router.post("/submit", auth(["CANDIDATE"]), deadlineGuard, controller.submitApplication);

router.post("/referee/reminder/:id", auth(["CANDIDATE"]), controller.remindReferee);

router.post("/upload",       auth(["CANDIDATE"]), documentUpload.single("file"), controller.uploadDocument);
router.post("/upload-multi", auth(["CANDIDATE"]), documentUpload.single("file"), controller.uploadMultiDocument);

// NEW: candidate submits their preferred joining date (shown after offer letter)
router.post("/joining-date", auth(["CANDIDATE"]), controller.submitJoiningDate);

/* ── Onboarding status for candidate portal ── */
router.get("/onboarding", auth(["CANDIDATE"]), async (req, res) => {
  try {
    const Candidate = require("../models/Candidate");
    const { CandidateApplication } = require("../models");

    const candidateDoc = await Candidate.findOne({ where: { email: req.user.email } });
    if (!candidateDoc) return res.json({ selected: false, record: null });

    const selected = await SelectedCandidate.findOne({ where: { candidateId: candidateDoc.id } });
    const record   = await OnboardingRecord.findOne({ where: { candidateId: candidateDoc.id } });
    const app = await CandidateApplication.findOne({ where: { candidateUserId: req.user.id } });
    // Also return WAITLISTED status so the candidate portal can show it
    if (!selected || !["SELECTED","WAITLISTED"].includes(selected.status)) {
      // Check if application is in QUERY state even for non-selected
      return res.json({
        selected:        false,
        selectionStatus: selected?.status || null,
        applicationStatus: app?.status || "DRAFT",
        record: null,
      });
    }
    if (!record?.offerLetterPath) {
      return res.json({
        selected:          false,   // ← looks "not selected yet" to candidate
        selectionStatus:   null,    // ← don't leak SELECTED/WAITLISTED
        applicationStatus: app?.status || "SUBMITTED",
        record:            null,
      });
    }

    const raw = record.toJSON();
    delete raw.joiningLetterPath;
    delete raw.joiningLetterUploadedAt;

    res.json({
      selected:           true,
      selectionStatus:    selected.status,
      waitlistedPriority: selected.waitlistPriority || null,
      applicationStatus:  app?.status || "SUBMITTED",
      designation:        selected.designation    || null,
      employmentType:     selected.employmentType || null,
      department:         record?.department      || selected.department || null,
      record:             raw,
    });
  } catch (err) {
    console.error("ONBOARDING ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post(
  "/experience/:id/certificate",
  auth(["CANDIDATE"]),
  documentUpload.single("file"),
  controller.uploadExperienceCertificate
);

module.exports = router;