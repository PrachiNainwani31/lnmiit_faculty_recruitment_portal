const express = require("express");
const auth    = require("../middlewares/auth");
const {
  emailAllCandidates,
  emailCandidate,
  emailAllExperts,
  notifyDofaUpload,
} = require("../controllers/email.controller");
const { sendEmail } = require("../utils/emailSender");
const Candidate     = require("../models/Candidate");

const router = express.Router();

/* ── Existing routes ── */
router.post("/candidates/:id",             auth(["DOFA"]), emailCandidate);
router.post("/candidates/department/:dept",auth(["DOFA"]), emailAllCandidates);
router.post("/experts/hod/:hodId",         auth(["DOFA"]), emailAllExperts);
router.post("/notify-dofa",                auth(["HOD"]),  notifyDofaUpload);

/* ── Interview invitation email ── */
router.post("/send-interview-invite", auth(["DOFA", "DOFA_OFFICE"]), async (req, res) => {
  try {
    const { candidateId, subject, body } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    await sendEmail(
      candidate.email,
      subject,
      `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px">
        <div style="background:#8b0000;color:#fff;padding:15px;text-align:center;border-radius:6px 6px 0 0">
          <h2 style="margin:0">LNMIIT Recruitment Portal</h2>
        </div>
        <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px;white-space:pre-wrap;font-size:14px;line-height:1.7;color:#333">
${body}
        </div>
      </div>`
    );

    res.json({ success: true, sentTo: candidate.email });
  } catch (err) {
    console.error("Interview invite error:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

/* ── Expert invitation email ── */
router.post("/send-expert-invite", auth(["DOFA", "DOFA_OFFICE"]), async (req, res) => {
  try {
    const Expert = require("../models/Expert");
    const { expertId, subject, body } = req.body;

    const expert = await Expert.findById(expertId);
    if (!expert) return res.status(404).json({ message: "Expert not found" });

    await sendEmail(
      expert.email,
      subject,
      `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px">
        <div style="background:#8b0000;color:#fff;padding:15px;text-align:center;border-radius:6px 6px 0 0">
          <h2 style="margin:0">LNMIIT Recruitment Portal</h2>
        </div>
        <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px;white-space:pre-wrap;font-size:14px;line-height:1.7;color:#333">
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