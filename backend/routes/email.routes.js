const express   = require("express");
const auth      = require("../middlewares/auth");
const { sendEmail } = require("../utils/emailSender");
const Candidate     = require("../models/Candidate");

const router = express.Router();

/* ── Interview invitation (editable body, sent from DOFA portal) ── */
router.post("/send-interview-invite", auth(["DOFA", "DOFA_OFFICE"]), async (req, res) => {
  try {
    const { candidateId, subject, body } = req.body;
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

    // Build email — append credentials if account was just created
    const credentialBlock = portalCreated ? `
      <div style="background:#f0fdf4;border:1px solid #86efac;padding:15px;border-radius:6px;margin-top:20px">
        <p style="margin:0 0 8px;font-weight:bold;color:#166534">Your Portal Login Credentials</p>
        <table style="border-collapse:collapse;width:100%">
          <tr>
            <td style="padding:6px;border:1px solid #ddd;background:#f9f9f9;font-weight:bold;width:40%">Email</td>
            <td style="padding:6px;border:1px solid #ddd">${candidate.email}</td>
          </tr>
          <tr>
            <td style="padding:6px;border:1px solid #ddd;background:#f9f9f9;font-weight:bold">Temporary Password</td>
            <td style="padding:6px;border:1px solid #ddd;font-family:monospace;font-size:15px;letter-spacing:2px">
              <strong>${plainPassword}</strong>
            </td>
          </tr>
        </table>
        <p style="margin:10px 0 0;font-size:12px;color:#166534">
          ⚠ Please log in and reset your password using "Forgot Password" immediately.
        </p>
      </div>` : "";

    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

    await sendEmail(
      candidate.email,
      subject,
      `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px">
        <div style="background:#8b0000;color:#fff;padding:15px;text-align:center;border-radius:6px 6px 0 0">
          <h2 style="margin:0">LNMIIT Recruitment Portal</h2>
        </div>
        <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px;
             white-space:pre-wrap;font-size:14px;line-height:1.7;color:#333">
          ${body.replace(/\$name/g, candidate.fullName || "Candidate")}
          ${credentialBlock}
          ${portalCreated
            ? `<div style="margin-top:20px">
                <a href="${FRONTEND_URL}/login"
                  style="background:#8b0000;color:#fff;padding:10px 24px;border-radius:5px;text-decoration:none;font-weight:bold">
                  Login to Portal
                </a>
               </div>`
            : ""}
        </div>
      </div>`
    );

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

/* ── Expert invitation (editable body, sent from DOFA portal) ── */
router.post("/send-expert-invite", auth(["DOFA", "DOFA_OFFICE"]), async (req, res) => {
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
          <h2 style="margin:0">LNMIIT Recruitment Portal</h2>
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