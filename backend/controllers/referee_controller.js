const CandidateApplication = require("../models/CandidateApplication");
const { sendEmail } = require("../utils/emailSender");

/* ─────────────────────────────────────────
   GET REFEREE INFO (public — via email link)
───────────────────────────────────────── */
exports.getRefereeInfo = async (req, res) => {
  try {
    const { refereeId } = req.params;
    if (!refereeId || refereeId === "undefined") {
      return res.status(400).json({ message: "Invalid referee link" });
    }

    const app = await CandidateApplication.findOne({ "referees._id": refereeId });
    if (!app) return res.status(404).json({ message: "Invalid or expired link" });

    const referee = app.referees.id(refereeId);
    res.json({
      refereeId,
      candidateName:    app.name,
      refereeName:      referee.name,
      refereeEmail:     referee.email,
      status:           referee.status,
      alreadySubmitted: referee.status === "SUBMITTED",
    });
  } catch (err) {
    console.error("getRefereeInfo error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   UPLOAD REFERENCE LETTER
───────────────────────────────────────── */
exports.uploadReferenceLetter = async (req, res) => {
  try {
    const { refereeId } = req.params;
    const { signedName } = req.body;

    if (!req.file)           return res.status(400).json({ message: "PDF file is required" });
    if (!signedName?.trim()) return res.status(400).json({ message: "Signature is required" });

    const app = await CandidateApplication.findOne({ "referees._id": refereeId });
    if (!app) return res.status(404).json({ message: "Invalid or expired link" });

    const referee       = app.referees.id(refereeId);
    referee.letter      = req.file.path;
    referee.signedName  = signedName.trim();
    referee.status      = "SUBMITTED";
    referee.submittedAt = new Date();

    app.markModified("referees"); // CRITICAL: Mongoose won't detect subdoc changes without this
    await app.save();

    // Notify candidate
    if (app.email) {
      await sendEmail(
        app.email,
        `Reference Letter Submitted by ${referee.name}`,
        `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
          <div style="background:#8b0000;color:#fff;padding:15px;text-align:center;border-radius:6px 6px 0 0">
            <h2 style="margin:0">LNMIIT Recruitment Portal</h2>
          </div>
          <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
            <p>Dear <strong>${app.name}</strong>,</p>
            <p>Your referee <strong>${referee.name}</strong> has submitted their reference letter.</p>
            <p>You can check the status on your candidate portal.</p>
            <p>Best regards,<br><strong>Webmaster LNMIIT</strong><br>webmaster@lnmiit.ac.in</p>
          </div>
        </div>
        `
      ).catch(err => console.error("Candidate notify failed:", err.message));
    }

    res.json({ success: true, message: "Reference letter uploaded successfully" });
  } catch (err) {
    console.error("uploadReferenceLetter error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

/* ─────────────────────────────────────────
   GET REFEREE STATUS (for candidate portal)
   FIX: now returns letterPath too
───────────────────────────────────────── */
exports.getRefereeStatus = async (req, res) => {
  try {
    const app = await CandidateApplication.findOne({ candidate: req.user._id });
    if (!app) return res.status(404).json({ message: "Application not found" });

    const statuses = app.referees.map(r => ({
      id:          r._id,
      name:        r.name,
      email:       r.email,
      designation: r.designation,
      institute:   r.institute,
      status:      r.status || "PENDING",
      submittedAt: r.submittedAt || null,
      letterPath:  r.letter || null,   // ← so candidate can view the letter
    }));

    res.json(statuses);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   SEND REMINDER TO REFEREE (from candidate)
───────────────────────────────────────── */
exports.sendRefereeReminder = async (req, res) => {
  try {
    const { refereeId } = req.params;

    const app = await CandidateApplication.findOne({ "referees._id": refereeId });
    if (!app) return res.status(404).json({ message: "Application not found" });

    const referee = app.referees.id(refereeId);
    if (referee.status === "SUBMITTED") {
      return res.json({ message: "Referee has already submitted" });
    }

    const portalLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/referee/${refereeId}`;

    await sendEmail(
      referee.email,
      "Gentle Reminder: Reference Letter Required",
      `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
        <div style="background:#8b0000;color:#fff;padding:15px;text-align:center;border-radius:6px 6px 0 0">
          <h2 style="margin:0">LNMIIT Recruitment Portal</h2>
        </div>
        <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
          <p>Dear <strong>${referee.name}</strong>,</p>
          <p>This is a gentle reminder that your reference letter for <strong>${app.name}</strong> is still pending.</p>
          <p style="text-align:center;margin:25px 0">
            <a href="${portalLink}" style="background:#8b0000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
              Submit Reference Letter
            </a>
          </p>
          <p>Best regards,<br><strong>DOFA Office</strong><br>LNMIIT</p>
        </div>
      </div>
      `
    );

    res.json({ success: true });
  } catch (err) {
    console.error("sendRefereeReminder error:", err);
    res.status(500).json({ message: "Failed to send reminder" });
  }
};