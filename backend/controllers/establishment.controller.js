const OnboardingRecord  = require("../models/OnboardingRecord");
const SelectedCandidate = require("../models/SelectedCandidate");
const Candidate         = require("../models/Candidate");
const User              = require("../models/User");
const { sendEmail }     = require("../utils/emailSender");
const CYCLE             = require("../config/activeCycle");
const BASE_URL          = process.env.FRONTEND_URL || "http://localhost:5173";

/* ── Get all onboarding records grouped by department ── */
exports.getOnboardingRecords = async (req, res) => {
  try {
    const records = await OnboardingRecord.find({ cycle: CYCLE })
      .populate("candidate")
      .populate("hodId", "department name email");

    // Group by department
    const deptMap = {};
    records.forEach(r => {
      const dept = r.department || "General";
      if (!deptMap[dept]) deptMap[dept] = [];
      deptMap[dept].push(r);
    });

    res.json(Object.entries(deptMap).map(([dept, records]) => ({ department: dept, records })));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch records" });
  }
};

/* ── Upload offer letter ── */
exports.uploadOfferLetter = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF required" });
    const { candidateId } = req.body;

    const record = await OnboardingRecord.findOneAndUpdate(
      { candidate: candidateId, cycle: CYCLE },
      {
        offerLetterPath:            req.file.path,
        offerLetterUploadedAt:      new Date(),
        offerLetterSentToCandidate: true,
      },
      { new: true }
    ).populate("candidate");

    // Find candidate's application email
    const CandidateApplication = require("../models/CandidateApplication");
    const app = await CandidateApplication.findOne({ candidate: record?.candidate?.email })
      .catch(() => null);

    const toEmail = record?.candidate?.email;
    if (toEmail) {
      await sendEmail(
        toEmail,
        "Offer Letter — LNMIIT Faculty Recruitment",
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
          <div style="background:#8b0000;color:#fff;padding:15px;text-align:center;border-radius:6px 6px 0 0">
            <h2 style="margin:0">LNMIIT Recruitment Portal</h2>
          </div>
          <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
            <p>Dear ${record?.candidate?.fullName || "Candidate"},</p>
            <p>Congratulations! We are pleased to inform you that you have been selected for the faculty position at LNMIIT.</p>
            <p>Your offer letter has been uploaded to the portal. Please log in to view and download it.</p>
            <p>Portal: <a href="${BASE_URL}">${BASE_URL}</a></p>
            <p>With Regards,<br>Establishment Section<br>LNMIIT</p>
          </div>
        </div>`
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
    const record = await OnboardingRecord.findOneAndUpdate(
      { candidate: candidateId, cycle: CYCLE },
      { joiningDate: new Date(joiningDate) },
      { new: true }
    );
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ message: "Failed to set joining date" });
  }
};

/* ── Upload joining letter ── */
exports.uploadJoiningLetter = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF required" });
    const { candidateId } = req.body;

    const record = await OnboardingRecord.findOneAndUpdate(
      { candidate: candidateId, cycle: CYCLE },
      { joiningLetterPath: req.file.path, joiningLetterUploadedAt: new Date() },
      { new: true }
    ).populate("candidate");

    const toEmail = record?.candidate?.email;
    if (toEmail) {
      await sendEmail(
        toEmail,
        "Joining Letter — LNMIIT Faculty Recruitment",
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
          <div style="background:#8b0000;color:#fff;padding:15px;text-align:center;border-radius:6px 6px 0 0">
            <h2 style="margin:0">LNMIIT Recruitment Portal</h2>
          </div>
          <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
            <p>Dear ${record?.candidate?.fullName || "Candidate"},</p>
            <p>Your joining letter has been uploaded. Please report on <strong>${new Date(record.joiningDate).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}</strong>.</p>
            <p>Log in to view your joining letter: <a href="${BASE_URL}">${BASE_URL}</a></p>
            <p>With Regards,<br>Establishment Section<br>LNMIIT</p>
          </div>
        </div>`
      ).catch(console.error);
    }

    res.json({ success: true, record });
  } catch (err) {
    console.error("uploadJoiningLetter error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

/* ── DOFA Office: Allot room ── */
exports.allotRoom = async (req, res) => {
  try {
    const { candidateId, roomBuilding, roomNumber, roomNotes } = req.body;

    const record = await OnboardingRecord.findOneAndUpdate(
      { candidate: candidateId, cycle: CYCLE },
      {
        roomBuilding,
        roomNumber,
        roomNotes,
        roomAllottedAt:  new Date(),
        roomAllottedBy:  req.user._id,
      },
      { new: true }
    ).populate("candidate");

    // Notify candidate
    const toEmail = record?.candidate?.email;
    if (toEmail) {
      await sendEmail(
        toEmail,
        "Room Allotted — LNMIIT",
        `<p>Dear ${record?.candidate?.fullName},</p>
         <p>Your accommodation has been arranged:</p>
         <p><strong>Building:</strong> ${roomBuilding}<br><strong>Room:</strong> ${roomNumber}</p>
         ${roomNotes ? `<p><strong>Note:</strong> ${roomNotes}</p>` : ""}
         <p>With Regards,<br>DOFA Office<br>LNMIIT</p>`
      ).catch(console.error);
    }

    // Notify Estate and LUCS
    const notifyRoles = await User.find({ role: { $in: ["ESTATE", "LUCS"] } });
    for (const u of notifyRoles) {
      await sendEmail(
        u.email,
        `Room Allotted: ${record?.candidate?.fullName}`,
        `<p>Room ${roomNumber} in ${roomBuilding} has been allotted to ${record?.candidate?.fullName} (${record?.department} dept). Please take required action on the portal.</p>`
      ).catch(console.error);
    }

    res.json({ success: true, record });
  } catch (err) {
    console.error("allotRoom error:", err);
    res.status(500).json({ message: "Failed to allot room" });
  }
};