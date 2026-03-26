const { OnboardingRecord, SelectedCandidate, Candidate, User, CandidateApplication } = require("../models");
const { sendEmail } = require("../utils/emailSender");
const CYCLE = require("../config/activeCycle");
const BASE_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/* ── Get all onboarding records grouped by department ── */
exports.getOnboardingRecords = async (req, res) => {
  try {
    const records = await OnboardingRecord.findAll({
      where: { cycle: CYCLE },
      include: [
        { model: Candidate, as: "candidate" },
        { model: User, as: "hod", attributes: ["department", "name", "email"] }
      ]
    });

    const deptMap = {};

    records.forEach(r => {
      const dept = r.department || "General";
      if (!deptMap[dept]) deptMap[dept] = [];
      deptMap[dept].push(r);
    });

    res.json(
      Object.entries(deptMap).map(([dept, records]) => ({
        department: dept,
        records
      }))
    );

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch records" });
  }
};

/* ── Upload offer letter ── */
exports.uploadOfferLetter = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "PDF required" });

    const { candidateId } = req.body;

    await OnboardingRecord.update(
      {
        offerLetterPath: req.file.path,
        offerLetterUploadedAt: new Date(),
        offerLetterSentToCandidate: true,
      },
      {
        where: { candidateId, cycle: CYCLE }
      }
    );

    const record = await OnboardingRecord.findOne({
      where: { candidateId, cycle: CYCLE },
      include: [{ model: Candidate, as: "candidate" }]
    });

    const toEmail = record?.candidate?.email;

    if (toEmail) {
      await sendEmail(
        toEmail,
        "Offer Letter — LNMIIT",
        `<p>Offer letter uploaded. Login: <a href="${BASE_URL}">${BASE_URL}</a></p>`
      ).catch(console.error);
    }

    res.json({ success: true, record });

  } catch (err) {
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
      where: { candidateId, cycle: CYCLE }
    });

    res.json({ success: true, record });

  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};

/* ── Upload joining letter ── */
exports.uploadJoiningLetter = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "PDF required" });

    const { candidateId } = req.body;

    await OnboardingRecord.update(
      {
        joiningLetterPath: req.file.path,
        joiningLetterUploadedAt: new Date(),
      },
      { where: { candidateId, cycle: CYCLE } }
    );

    const record = await OnboardingRecord.findOne({
      where: { candidateId, cycle: CYCLE },
      include: [{ model: Candidate, as: "candidate" }]
    });

    const toEmail = record?.candidate?.email;

    if (toEmail) {
      await sendEmail(
        toEmail,
        "Joining Letter",
        `<p>Your joining date: ${new Date(record.joiningDate).toDateString()}</p>`
      );
    }

    res.json({ success: true, record });

  } catch (err) {
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
        roomAllottedAt: new Date(),
        roomAllottedBy: req.user.id,
      },
      { where: { candidateId, cycle: CYCLE } }
    );

    const record = await OnboardingRecord.findOne({
      where: { candidateId, cycle: CYCLE },
      include: [{ model: Candidate, as: "candidate" }]
    });

    const toEmail = record?.candidate?.email;

    if (toEmail) {
      await sendEmail(
        toEmail,
        "Room Allotted",
        `<p>Room ${roomNumber} in ${roomBuilding}</p>`
      );
    }

    // Notify ESTATE + LUCS
    const notifyUsers = await User.findAll({
      where: { role: ["ESTATE", "LUCS"] }
    });

    for (const u of notifyUsers) {
      await sendEmail(
        u.email,
        "Room Allotted",
        `<p>${record?.candidate?.fullName} assigned room ${roomNumber}</p>`
      );
    }

    res.json({ success: true, record });

  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};