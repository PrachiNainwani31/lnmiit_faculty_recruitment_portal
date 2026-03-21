const CandidateApplication = require("../models/CandidateApplication");
const { sendEmail } = require("../utils/emailSender");

/* ─────────────────────────────────────────
   GET DOCUMENT TRACKING
   FIX: don't require hod chain — group by
   candidate email/name directly
───────────────────────────────────────── */
exports.getDocumentTracking = async (req, res) => {
  try {
    const applications = await CandidateApplication.find();

    // Return all applications — DOFA sees everyone
    const result = applications
      .filter(app => app.name || app.email) // skip empty records
      .map(app => ({
        department: "General", // flat list — no HOD grouping needed
        candidates: [{
          id:            app._id,
          name:          app.name          || "—",
          email:         app.email         || "—",
          phone:         app.phone         || app.contact || "—",
          documents:     app.documents     || {},
          verdicts:      app.verdicts      || {},
          referees:      app.referees      || [],
          experiences:   app.experiences   || [],
          accommodation: app.accommodation || false,
        }]
      }));

    // Group by department if candidate filled it in, otherwise "General"
    const deptMap = {};
    applications
      .filter(app => app.name || app.email)
      .forEach(app => {
        const dept = app.department || "General";
        if (!deptMap[dept]) deptMap[dept] = { department: dept, candidates: [] };
        deptMap[dept].candidates.push({
          id:            app._id,
          name:          app.name          || "—",
          email:         app.email         || "—",
          phone:         app.phone         || app.contact || "—",
          documents:     app.documents     || {},
          verdicts:      app.verdicts      || {},
          referees:      app.referees      || [],
          experiences:   app.experiences   || [],
          accommodation: app.accommodation || false,
        });
      });

    res.json(Object.values(deptMap));
  } catch (err) {
    console.error("getDocumentTracking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   UPDATE DOCUMENT VERDICT
───────────────────────────────────────── */
exports.updateDocumentVerdict = async (req, res) => {
  const { appId, doc, status, remark } = req.body;

  const app = await CandidateApplication.findById(appId);
  if (!app) return res.status(404).json({ message: "Application not found" });

  if (!app.verdicts) app.verdicts = {};
  app.verdicts[doc] = { status, remark };
  app.markModified("verdicts");
  await app.save();

  res.json({ success: true });
};

/* ─────────────────────────────────────────
   SEND REMINDER
───────────────────────────────────────── */
exports.sendReminder = async (req, res) => {
  try {
    const { candidateId } = req.body;

    const app = await CandidateApplication.findById(candidateId);
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (!app.email) return res.status(400).json({ message: "Candidate email not found" });

    const issues = [];
    Object.entries(app.verdicts || {}).forEach(([doc, val]) => {
      if (val?.status === "Incorrect" || val?.status === "Missing") {
        issues.push(`• ${doc} — ${val.status}${val.remark ? ` (${val.remark})` : ""}`);
      }
    });

    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

    const issueBlock = issues.length > 0
      ? `The following document(s) require your attention:\n\n${issues.join("\n")}`
      : "Please ensure all required documents have been uploaded correctly.";

    await sendEmail(
      app.email,
      "Action Required — Document Submission / Correction",
      `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
        <div style="background:#8b0000;color:#fff;padding:15px;text-align:center;border-radius:6px 6px 0 0">
          <h2 style="margin:0">LNMIIT Recruitment Portal</h2>
        </div>
        <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
          <p>Date: ${dateStr}</p>
          <p>Dear <strong>${app.name || "Candidate"}</strong>,</p>
          <p>${issueBlock}</p>
          <p>Please log in to the portal and take action at the earliest.</p>
          <p>Best regards,<br><strong>DOFA Office</strong><br>LNMIIT</p>
        </div>
      </div>
      `
    );

    res.json({ success: true, message: `Reminder sent to ${app.email}` });
  } catch (err) {
    console.error("sendReminder error:", err);
    res.status(500).json({ error: "Failed to send reminder" });
  }
};