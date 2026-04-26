// controllers/referee_controller.js
const { CandidateApplication, CandidateReferee } = require("../models");
const templates     = require("../utils/emailTemplates");
const { sendEmail } = require("../utils/emailSender");
const { User }      = require("../models");

/* ── helper: resolve signedName safely ──────────────────────────────
   Drawn signatures arrive as base64 data URLs (20,000+ chars).
   Storing them in VARCHAR/TEXT(200) causes "Data too long" 500 errors.
   Solution: detect base64, store "<name> (drawn)" instead.
   The visual drawing is only needed on-screen during submission.
──────────────────────────────────────────────────────────────────── */
const resolveSignedName = (signedName, fallbackName) => {
  if (!signedName) return fallbackName || null;
  if (signedName.startsWith("data:")) return `${fallbackName || "Referee"} (drawn signature)`;
  return signedName.slice(0, 400); // hard cap for typed names
};

exports.getRefereeInfo = async (req, res) => {
  try {
    const referee = await CandidateReferee.findByPk(req.params.refereeId);
    if (!referee) return res.status(404).json({ message: "Invalid or expired link" });
    const app = await CandidateApplication.findByPk(referee.applicationId);
    if (!app)  return res.status(404).json({ message: "Application not found" });
    res.json({
      refereeId:        referee.id,
      candidateName:    app.name,
      refereeName:      referee.name,
      refereeEmail:     referee.email,
      status:           referee.status,
      alreadySubmitted: referee.status === "SUBMITTED",
      requiresCaptcha:  !!referee.captchaCode,
    });
  } catch (err) {
    console.error("getRefereeInfo error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyCaptcha = async (req, res) => {
  try {
    const { refereeId, captcha } = req.body;
    const referee = await CandidateReferee.findByPk(refereeId);
    if (!referee) return res.status(404).json({ message: "Invalid link" });

    if (!referee.captchaCode) return res.json({ success: true });

    if (referee.captchaCode.toUpperCase() !== (captcha || "").toUpperCase().trim()) {
      return res.status(400).json({ message: "Incorrect access code. Please check your email." });
    }

    // DON'T clear captchaCode here — clear it in uploadReferenceLetter instead
    res.json({ success: true });
  } catch (err) {
    console.error("verifyCaptcha error:", err.message);
    res.status(500).json({ message: "Verification failed" });
  }
};

/* =====================================================
   UPLOAD REFERENCE LETTER
    FIX: base64 drawn signatures no longer stored raw —
   causes "Data too long for column 'signedName'" 500.
===================================================== */
exports.uploadReferenceLetter = async (req, res) => {
  try {
    const { refereeId } = req.params;
    const { signedName, guestEmail, designation, department, institute } = req.body;

    if (!req.file) return res.status(400).json({ message: "PDF file required" });

    const referee = await CandidateReferee.findByPk(refereeId);
    if (!referee)                       return res.status(404).json({ message: "Invalid link" });
    if (referee.status === "SUBMITTED") return res.status(400).json({ message: "Reference already submitted" });

    // FIX: strip base64 drawing, store readable name
    const safeSignedName = resolveSignedName(signedName, referee.name || guestEmail);

    const updateData = {
      letter:      req.file.path,
      signedName:  safeSignedName,
      status:      "SUBMITTED",
      submittedAt: new Date(),
      captchaCode:null,
    };

    if (designation) updateData.designation = designation;
    if (department)  updateData.department  = department;
    if (institute)   updateData.institute   = institute;
    if (guestEmail && !referee.email) updateData.email = guestEmail;

    await CandidateReferee.update(updateData, { where: { id: refereeId } });

    const app = await CandidateApplication.findByPk(referee.applicationId);
    const dofaOfficeUsers = await User.findAll({ where: { role: "DoFA_OFFICE" } });
    const tmpl = templates.refereeSubmitted({
      refereeName:   referee.name,
      candidateName: app?.name       || "—",
      department:    app?.department || "—",
    });
    for (const u of dofaOfficeUsers) {
      await sendEmail(u.email, tmpl.subject, tmpl.html).catch(console.error);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("uploadReferenceLetter error:", err.message);
    res.status(500).json({ message: "Upload failed" });
  }
};

exports.getRefereeStatus = async (req, res) => {
  try {
    const app = await CandidateApplication.findOne({ where: { candidateUserId: req.user.id } });
    if (!app) return res.status(404).json({ message: "Application not found" });
    const referees = await CandidateReferee.findAll({
      where: { applicationId: app.id },
      order: [["id", "ASC"]],
    });
    res.json(referees.map(r => ({
      id: r.id, salutation: r.salutation, name: r.name,
      designation: r.designation, department: r.department,
      institute: r.institute, email: r.email,
      status: r.status || "PENDING",
      submittedAt: r.submittedAt || null,
      letterPath: r.letter || null,
    })));
  } catch (err) {
    console.error("getRefereeStatus error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.sendRefereeReminder = async (req, res) => {
  try {
    const { refereeId } = req.params;
    const referee = await CandidateReferee.findByPk(refereeId);
    if (!referee)                       return res.status(404).json({ message: "Referee not found" });
    if (referee.status === "SUBMITTED") return res.status(400).json({ message: "Already submitted" });

    const app     = await CandidateApplication.findByPk(referee.applicationId);
    const baseUrl = (process.env.FRONTEND_URL).replace(/\/+$/, "");
    const portalLink = `${baseUrl}/referee/${refereeId}`;

    // ✅ ADD: generate fresh captcha and save it
    const crypto  = require("crypto");
    const captcha = crypto.randomBytes(3).toString("hex").toUpperCase();
    await CandidateReferee.update({ captchaCode: captcha }, { where: { id: refereeId } });

    const tmpl = templates.refereeReminder({
      refereeName:   referee.name,
      candidateName: app?.name || "the candidate",
      portalLink,
      captcha,   
    });
    await sendEmail(referee.email, tmpl.subject, tmpl.html);
    res.json({ success: true });
  } catch (err) {
    console.error("sendRefereeReminder error:", err.message);
    res.status(500).json({ message: "Failed to send reminder" });
  }
};