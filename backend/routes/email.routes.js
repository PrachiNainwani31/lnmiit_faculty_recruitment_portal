const express   = require("express");
const auth      = require("../middlewares/auth");
const { sendEmail } = require("../utils/emailSender");
const Candidate     = require("../models/Candidate");

const router = express.Router();

/* ── Interview invitation (editable body, sent from DoFA portal) ── */
router.post("/send-interview-invite", auth(["DoFA","ADoFA", "DoFA_OFFICE"]), async (req, res) => {
  try {
    const { candidateId, subject, body,deadlineAt } = req.body;
    if (!subject?.trim() || !body?.trim())
      return res.status(400).json({ message: "Subject and body are required" });

    const Candidate = require("../models/Candidate");
    const { User }  = require("../models");
    const bcrypt    = require("bcryptjs");
    const { generatePassword } = require("../utils/passwordGenerator");
    const { log }   = require("../utils/activityLogger");

    const candidate = await Candidate.findByPk(candidateId);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    // ✅ Create portal account if one doesn't exist yet
    let portalCreated = false;
    let plainPassword = null;
    let newUser=null;
    const existing = await User.findOne({ where: { email: candidate.email } });
    if (!existing) {
      plainPassword = generatePassword();
      newUser = await User.create({
        name:       candidate.fullName || candidate.email,
        email:      candidate.email,
        password:   plainPassword,      // beforeCreate hook hashes it
        role:       "CANDIDATE",
        department: candidate.department || null,
      });
      portalCreated = true;

      await log({
        user:        req.user,
        action:      "CANDIDATE_ACCOUNT_CREATED",
        entity:      "Candidate",
        entityId:    candidateId,
        description: `Portal account created for candidate ${candidate.email}`,
        req,
      });
    }
    if (portalCreated) {
      await Candidate.update(
        { userId: newUser.id },           // save reference
        { where: { id: candidateId } }
      );
    }

    const deadlineBlock = deadlineAt
      ? `<div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:20px 24px;margin:24px 0;text-align:center">
          <p style="margin:0 0 8px;font-size:12px;font-weight:bold;color:#92400e;text-transform:uppercase;letter-spacing:1px">
            Application Deadline
          </p>
          <p style="margin:0;font-size:22px;font-weight:bold;color:#92400e">
            ${new Date(deadlineAt).toLocaleDateString("en-GB", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
          <p style="margin:4px 0 0;font-size:14px;color:#b45309;font-weight:500">
            at ${new Date(deadlineAt).toLocaleTimeString("en-GB", {
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
          <p style="margin:12px 0 0;font-size:12px;color:#92400e;background:#fef3c7;padding:8px 12px;border-radius:4px;display:inline-block">
            Please ensure your application is submitted before this date.
          </p>
        </div>`
      : "";

    const credentialBlock = portalCreated
      ? `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px 24px;margin:24px 0">
          <p style="margin:0 0 14px;font-weight:bold;color:#166534;font-size:14px">
            Your Portal Login Credentials
          </p>
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            <tr>
              <td style="padding:10px 14px;border:1px solid #bbf7d0;background:#dcfce7;
                          font-weight:bold;color:#166534;width:40%;border-radius:4px 0 0 0">
                Email Address
              </td>
              <td style="padding:10px 14px;border:1px solid #bbf7d0;color:#1f2937">
                ${candidate.email}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border:1px solid #bbf7d0;background:#dcfce7;
                          font-weight:bold;color:#166534;border-radius:0 0 0 4px">
                Temporary Password
              </td>
              <td style="padding:10px 14px;border:1px solid #bbf7d0;
                          font-family:Courier New,monospace;font-size:16px;
                          letter-spacing:3px;font-weight:bold;color:#1f2937">
                ${plainPassword}
              </td>
            </tr>
          </table>
          <div style="margin-top:14px;padding:10px 14px;background:#fef9c3;border:1px solid #fde047;
                      border-radius:6px;font-size:12px;color:#713f12">
            <strong>Important:</strong> Please log in immediately and change your password using
            the <strong>"Forgot Password"</strong> link on the login page.
          </div>
        </div>`
      : "";
    const FRONTEND_URL = process.env.FRONTEND_URL;

    const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;background:#f4f4f4;padding:30px 0">
      <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

        <!-- Header -->
        <div style="background:#8b0000;padding:24px 30px;text-align:center">
          <h2 style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.5px">
            LNMIIT Faculty Recruitment & Onboarding Portal
          </h2>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">
            The LNM Institute of Information Technology, Jaipur
          </p>
        </div>

        <!-- Body -->
        <div style="padding:30px;color:#333333;font-size:14px;line-height:1.8">
          <div style="white-space:pre-wrap;margin-bottom:20px">${
            body
              .replace(/\$name/g, candidate.fullName || "Candidate")
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/\n/g, "<br>")
          }</div>

          ${deadlineBlock}
          ${credentialBlock}

          ${portalCreated
            ? `<div style="text-align:center;margin-top:28px">
                <a href="${FRONTEND_URL}login"
                  style="display:inline-block;background:#8b0000;color:#ffffff;padding:12px 32px;
                          border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;
                          letter-spacing:0.3px">
                  Login to Portal →
                </a>
              </div>`
            : ""}
        </div>

        <!-- Footer -->
        <div style="background:#f9f9f9;border-top:1px solid #eeeeee;padding:16px 30px;text-align:center">
          <p style="margin:0;font-size:11px;color:#999999">
            This is an automated message from the LNMIIT Faculty Recruitment & Onboarding Portal.<br>
            Please do not reply directly to this email.
          </p>
        </div>

      </div>
    </div>`;

    await sendEmail(candidate.email, subject, htmlBody);

    if (candidate.secondaryEmail) {
      await sendEmail(candidate.secondaryEmail, subject, htmlBody).catch(console.error);
    }
    await log({
      user:        req.user,
      action:      "INTERVIEW_INVITE_SENT",
      entity:      "Candidate",
      entityId:    candidateId,
      description: `Interview invite sent to ${candidate.email}`,
      req,
    });

    res.json({
      success:        true,
      sentTo:         candidate.email,
      portalCreated,             // frontend can show a notice if account was created
    });
  } catch (err) {
    console.error("Interview invite error:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

/* ── Expert invitation (editable body, sent from DoFA portal) ── */
router.post("/send-expert-invite", auth(["DoFA","ADoFA", "DoFA_OFFICE"]), async (req, res) => {
  try {
    const Expert = require("../models/Expert");
    const { expertId, subject, body } = req.body;
    if (!subject?.trim() || !body?.trim())
      return res.status(400).json({ message: "Subject and body are required" });

    // Sequelize uses findByPk
    const expert = await Expert.findByPk(expertId);
    if (!expert) return res.status(404).json({ message: "Expert not found" });

    await sendEmail(
      expert.email,
      subject,
      `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px">
        <div style="background:#8b0000;color:#fff;padding:15px;text-align:center;border-radius:6px 6px 0 0">
          <h2 style="margin:0">LNMIIT Faculty Recruitment & Onboarding Portal</h2>
        </div>
        <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px;
             white-space:pre-wrap;font-size:14px;line-height:1.7;color:#333">
${body}
        </div>
      </div>`
    );

    res.json({ success: true, sentTo: expert.email });
  } catch (err) {
    console.error("Expert invite error:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

module.exports = router;