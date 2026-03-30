// controllers/establishment.controller.js
const { OnboardingRecord, SelectedCandidate, Candidate, User } = require("../models");
const { sendEmail } = require("../utils/emailSender");
const CYCLE = require("../config/activeCycle");
const BASE_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/* ── Get all onboarding records grouped by department ──
   ✅ Includes interviewComplete from SelectedCandidate so
   Establishment can gate the offer letter upload.
── */
exports.getOnboardingRecords = async (req, res) => {
  try {
    const { SelectedCandidate } = require("../models");

    const records = await OnboardingRecord.findAll({
      where: { cycle: CYCLE },
      include: [
        { model: Candidate, as: "candidate" },
        { model: User, as: "hod", attributes: ["department", "name", "email"] },
      ],
    });

    // Build a map of candidateId → interviewComplete from SelectedCandidate
    const selRecords = await SelectedCandidate.findAll({ where: { cycle: CYCLE } });
    const selMap = {};
    selRecords.forEach(s => { selMap[s.candidateId] = s; });

    const deptMap = {};
    records.forEach(r => {
      const dept = r.department || "General";
      if (!deptMap[dept]) deptMap[dept] = [];
      const sel = selMap[r.candidateId];
      deptMap[dept].push({
        ...r.toJSON(),
        // ✅ Gate field: offer letter only uploadable after interview marked complete
        interviewComplete: sel?.interviewComplete || false,
        designation:       sel?.designation       || "",
        employmentType:    sel?.employmentType     || "",
      });
    });

    res.json(
      Object.entries(deptMap).map(([department, records]) => ({ department, records }))
    );
  } catch (err) {
    console.error("getOnboardingRecords error:", err);
    res.status(500).json({ message: "Failed to fetch records" });
  }
};

/* ── Upload offer letter ── */
exports.uploadOfferLetter = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF required" });
    const { candidateId } = req.body;

    await OnboardingRecord.update(
      {
        offerLetterPath:            req.file.path,
        offerLetterUploadedAt:      new Date(),
        offerLetterSentToCandidate: true,
      },
      { where: { candidateId, cycle: CYCLE } }
    );

    const record = await OnboardingRecord.findOne({
      where:   { candidateId, cycle: CYCLE },
      include: [{ model: Candidate, as: "candidate" }],
    });

    // ✅ Notify candidate: "You have been selected"
    if (record?.candidate?.email) {
      await sendEmail(
        record.candidate.email,
        "Congratulations! You have been selected — LNMIIT",
        `<p>Dear ${record.candidate.fullName},</p>
         <p>Congratulations! You have been selected for the position at LNMIIT.</p>
         <p>Your offer letter is now available. Please log in to your candidate portal to view and download it:</p>
         <p><a href="${BASE_URL}">${BASE_URL}</a></p>
         <p>Regards,<br/>Establishment Section, LNMIIT</p>`
      ).catch(console.error);
    }

    res.json({ success: true, record });
  } catch (err) {
    console.error("uploadOfferLetter error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

/* ── Set joining date ── */
exports.setJoiningDate = async (req, res) => {
  try {
    const { candidateId, joiningDate } = req.body;

    await OnboardingRecord.update(
      { joiningDate: new Date(joiningDate) },
      { where: { candidateId, cycle: CYCLE } }
    );

    const record = await OnboardingRecord.findOne({
      where:   { candidateId, cycle: CYCLE },
      include: [{ model: Candidate, as: "candidate" }],
    });

    // Notify candidate of joining date
    if (record?.candidate?.email) {
      await sendEmail(
        record.candidate.email,
        "Your Joining Date — LNMIIT",
        `<p>Dear ${record.candidate.fullName},</p>
         <p>Your joining date has been confirmed: <strong>${new Date(joiningDate).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}</strong></p>
         <p>Please log in to your portal for further details: <a href="${BASE_URL}">${BASE_URL}</a></p>
         <p>Regards,<br/>Establishment Section, LNMIIT</p>`
      ).catch(console.error);
    }

    res.json({ success: true, record });
  } catch (err) {
    console.error("setJoiningDate error:", err);
    res.status(500).json({ message: "Failed" });
  }
};

/* ── Upload joining letter ──
   NOTE: Joining letter is NOT sent to candidate portal.
   It is visible to Establishment, HOD, DOFA, DOFA Office only.
── */
exports.uploadJoiningLetter = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF required" });
    const { candidateId } = req.body;

    await OnboardingRecord.update(
      {
        joiningLetterPath:       req.file.path,
        joiningLetterUploadedAt: new Date(),
      },
      { where: { candidateId, cycle: CYCLE } }
    );

    const record = await OnboardingRecord.findOne({
      where:   { candidateId, cycle: CYCLE },
      include: [{ model: Candidate, as: "candidate" }],
    });

    // Internal notification only — NOT sent to candidate
    res.json({ success: true, record });
  } catch (err) {
    console.error("uploadJoiningLetter error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

/* ── Allot room ── */
exports.allotRoom = async (req, res) => {
  try {
    const { candidateId, roomBuilding, roomNumber, roomNotes } = req.body;

    await OnboardingRecord.update(
      {
        roomBuilding,
        roomNumber,
        roomNotes,
        roomAllottedAt:   new Date(),
        roomAllottedById: req.user.id,
      },
      { where: { candidateId, cycle: CYCLE } }
    );

    const record = await OnboardingRecord.findOne({
      where:   { candidateId, cycle: CYCLE },
      include: [{ model: Candidate, as: "candidate" }],
    });

    if (record?.candidate?.email) {
      await sendEmail(
        record.candidate.email,
        "Room Allotted — LNMIIT",
        `<p>Room ${roomNumber} in ${roomBuilding} has been allotted to you.</p>`
      ).catch(console.error);
    }

    res.json({ success: true, record });
  } catch (err) {
    console.error("allotRoom error:", err);
    res.status(500).json({ message: "Failed" });
  }
};

/* ── Save MIS login + Library details ──
   Called after joining letter is uploaded.
   Updates misLoginDone/Note and libraryDone/Details.
── */
exports.saveMisLibrary = async (req, res) => {
  try {
    const {
      candidateId,
      misLoginDone, misLoginNote,
      libraryDone,  libraryDetails,
    } = req.body;

    // Gate: joining letter must exist
    const record = await OnboardingRecord.findOne({
      where: { candidateId, cycle: CYCLE },
    });
    if (!record)
      return res.status(404).json({ message: "Record not found" });
    if (!record.joiningLetterPath)
      return res.status(403).json({ message: "Joining letter must be uploaded first", gated: true });

    await OnboardingRecord.update(
      {
        misLoginDone:   !!misLoginDone,
        misLoginNote:   misLoginNote   || null,
        libraryDone:    !!libraryDone,
        libraryDetails: libraryDetails || null,
      },
      { where: { candidateId, cycle: CYCLE } }
    );

    const updated = await OnboardingRecord.findOne({
      where:   { candidateId, cycle: CYCLE },
      include: [{ model: Candidate, as: "candidate" }],
    });

    res.json({ success: true, record: updated });
  } catch (err) {
    console.error("saveMisLibrary error:", err);
    res.status(500).json({ message: "Failed to save" });
  }
};

/* ── Upload RFID card PDF ── */
exports.uploadRfidCard = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF required" });
    const { candidateId } = req.body;

    const record = await OnboardingRecord.findOne({ where: { candidateId, cycle: CYCLE } });
    if (!record?.joiningLetterPath)
      return res.status(403).json({ message: "Joining letter must be uploaded first", gated: true });

    await OnboardingRecord.update(
      { rfidDone: true, rfidPath: req.file.path },
      { where: { candidateId, cycle: CYCLE } }
    );

    const updated = await OnboardingRecord.findOne({
      where:   { candidateId, cycle: CYCLE },
      include: [{ model: Candidate, as: "candidate" }],
    });

    res.json({ success: true, record: updated });
  } catch (err) {
    console.error("uploadRfidCard error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

/* ── Send RFID card to candidate ──
   Emails the candidate with a link to their RFID card PDF.
   Marks rfidSentToCandidate = true.
── */
exports.sendRfidToCandidate = async (req, res) => {
  try {
    const { candidateId } = req.body;

    const record = await OnboardingRecord.findOne({
      where:   { candidateId, cycle: CYCLE },
      include: [{ model: Candidate, as: "candidate" }],
    });

    if (!record?.rfidPath)
      return res.status(400).json({ message: "RFID card not uploaded yet" });

    if (record?.candidate?.email) {
      await sendEmail(
        record.candidate.email,
        "Your RFID Card — LNMIIT",
        `<p>Dear ${record.candidate.fullName},</p>
         <p>Your RFID access card details are ready. Please log in to your portal to download it:</p>
         <p><a href="${BASE_URL}">${BASE_URL}</a></p>
         <p>Regards,<br/>Establishment Section, LNMIIT</p>`
      );
    }

    await OnboardingRecord.update(
      { rfidSentToCandidate: true, rfidSentAt: new Date() },
      { where: { candidateId, cycle: CYCLE } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("sendRfidToCandidate error:", err);
    res.status(500).json({ message: "Failed to send" });
  }
};