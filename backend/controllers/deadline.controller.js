const { PortalDeadline, CandidateApplication, User } = require("../models");
const { sendEmail } = require("../utils/emailSender");
const { log } = require("../utils/activityLogger");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

exports.setDeadline = async (req, res) => {
  try {
    const { cycle, deadlineAt } = req.body;
    if (!cycle || !deadlineAt)
      return res.status(400).json({ message: "cycle and deadlineAt required" });

    const existing = await PortalDeadline.findOne({ where: { cycle } });

    if (existing) {
  // Extension
  await PortalDeadline.update({
    previousDeadline: existing.deadlineAt,
    deadlineAt:       new Date(deadlineAt),
    extendedAt:       new Date(),
    extendedById:     req.user.id,
  }, { where: { cycle } });

  await log({
    user: req.user, action: "DEADLINE_EXTENDED",
    entity: "PortalDeadline", entityId: cycle,
    description: `Deadline extended from ${existing.deadlineAt} to ${deadlineAt}`, req,
  });

  // Send to ALL registered candidates (both submitted and draft) — same email
  // Also send to secondary emails
  const apps = await CandidateApplication.findAll();
  const { Candidate } = require("../models");

  for (const app of apps) {
    if (!app.email) continue;

    // Collect all email addresses for this candidate
    const emails = [app.email];
    // Try to get secondary email from Candidate table
    const candidateDoc = await Candidate.findOne({ where: { email: app.email } });
    if (candidateDoc?.secondaryEmail) emails.push(candidateDoc.secondaryEmail);

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
        <div style="background:#8b0000;color:#fff;padding:15px 20px;border-radius:6px 6px 0 0">
          <h2 style="margin:0;font-size:18px">LNMIIT Faculty Recruitment and Onboarding Portal</h2>
        </div>
        <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px;line-height:1.7;color:#333">
          <p>Dear ${app.name || "Applicant"},</p>
          <p>The application deadline has been extended. The new deadline is:</p>
          <div style="background:#fff8e1;border:1px solid #f59e0b;padding:14px 18px;border-radius:6px;margin:15px 0;text-align:center">
            <p style="margin:0 0 4px;font-size:13px;color:#92400e;font-weight:bold">📅 New Deadline</p>
            <p style="margin:0;font-size:18px;font-weight:bold;color:#92400e">
              ${new Date(deadlineAt).toLocaleString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <p>If you have already submitted your application, you may ignore this message — no further action is needed.</p>
          <p>If you have not yet submitted, please log in and complete your application before the deadline.</p>
          <div style="margin:20px 0">
            <a href="${FRONTEND_URL}/candidate"
              style="background:#8b0000;color:#fff;padding:10px 24px;border-radius:5px;text-decoration:none;font-weight:bold">
              Go to Portal
            </a>
          </div>
          <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
        </div>
        <p style="font-size:11px;color:#aaa;text-align:center;margin-top:12px">
          This is an automated message. Do not reply directly to this email.
        </p>
      </div>`;

    for (const email of emails) {
      await sendEmail(email, `Application Deadline Extended — LNMIIT Faculty Recruitment`, html)
        .catch(console.error);
    }}

    } else {
      // First-time set
      await PortalDeadline.create({
        cycle, deadlineAt: new Date(deadlineAt), createdById: req.user.id,
      });

      // Email all known candidates
      const apps = await CandidateApplication.findAll();
      for (const app of apps) {
        if (!app.email) continue;
        await sendEmail(
          app.email,
          `Application Deadline Set — LNMIIT Faculty Recruitment`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
            <div style="background:#8b0000;color:#fff;padding:15px 20px;border-radius:6px 6px 0 0">
              <h2 style="margin:0">LNMIITFaculty  Recruitment and Onboarding Portal</h2>
            </div>
            <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
              <p>Dear ${app.name || "Applicant"},</p>
              <p>The deadline to submit your faculty application is 
              <strong>${new Date(deadlineAt).toLocaleString("en-GB")}</strong>.</p>
              <p>Please ensure your application is complete and submitted before this date.</p>
              <div style="margin:20px 0">
                <a href="${FRONTEND_URL}/candidate"
                  style="background:#8b0000;color:#fff;padding:10px 24px;border-radius:5px;text-decoration:none;font-weight:bold">
                  Go to Portal
                </a>
              </div>
              <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
            </div>
          </div>`
        ).catch(console.error);
      }

      await log({
        user: req.user, action: "DEADLINE_SET",
        entity: "PortalDeadline", entityId: cycle,
        description: `Deadline set to ${deadlineAt}`, req,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("setDeadline error:", err);
    res.status(500).json({ message: "Failed to set deadline" });
  }
};

exports.getDeadline = async (req, res) => {
  try {
    const { cycle } = req.params;
    const deadline = await PortalDeadline.findOne({ where: { cycle } });
    res.json(deadline || null);
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};

exports.getActiveDeadline = async (req, res) => {
  try {
    const { RecruitmentCycle } = require("../models");
    // Get all active (non-closed) cycles
    const activeCycles = await RecruitmentCycle.findAll({
      where: { isClosed: false },
      attributes: ["cycle"],
      order: [["createdAt", "DESC"]],
    });
    if (!activeCycles.length) return res.json(null);

    const cycleStrings = activeCycles.map(c => c.cycle);
    // Find deadline for any active cycle
    const deadline = await PortalDeadline.findOne({
      where: { cycle: cycleStrings },
      order: [["createdAt", "DESC"]],
    });
    res.json(deadline || null);
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};