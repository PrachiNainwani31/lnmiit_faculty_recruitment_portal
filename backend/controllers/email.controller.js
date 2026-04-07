const transporter = require("../config/mailer");
const { User, Candidate, Expert, CandidateApplication } = require("../models");
const getCurrentCycle = require("../utils/getCurrentCycle");

/* ============================
   Send mail helper
============================ */
const sendMail = async (to, subject, html) => {
  transporter.sendMail({
    from: `"LNMIIT Recruitment" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  }).catch(err => console.error("Email error:", err));
};

/* ============================
   HOD uploaded notification
============================ */
exports.notifyDofaUpload = async ({ department, hodName }) => {
  try {
    const dofa = await User.findOne({
      where: { role: "DOFA" }
    });

    if (!dofa) return;

    await sendMail(
      dofa.email,
      "HOD Uploaded Experts",
      `<p>HOD <b>${hodName}</b> from <b>${department}</b> uploaded experts.</p>`
    );

  } catch (err) {
    console.error(err);
  }
};

/* ============================
   DOFA comment mail
============================ */
exports.notifyHodComment = async (hodEmail) => {
  await sendMail(
    hodEmail,
    "New Comment from DOFA",
    `<p>DOFA raised a comment. Check portal.</p>`
  );
};

/* ============================
   TEMPLATE FUNCTIONS
============================ */
const candidateMailTemplate = (name) => `
<p>Dear ${name}, upload required documents on portal.</p>
`;

exports.expertMailTemplate = (name) => `
<p>Dear ${name}, you are invited as expert.</p>
`;

/* ============================
   SEND SINGLE CANDIDATE
============================ */
exports.emailCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });

    const recipients = [candidate.email];
    if (candidate.secondaryEmail) recipients.push(candidate.secondaryEmail);

    for (const email of recipients) {
      await sendMail(email, "Recruitment Update", candidateMailTemplate(candidate.fullName));
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Email failed" });
  }
};

exports.emailAllCandidates = async (req, res) => {
  try {
    const department = req.params.dept;
    const hod = await User.findOne({ where: { role: "HOD", department } });
    if (!hod) return res.status(404).json({ message: "HOD not found" });

    // Get hod's current cycle
    const cycle = await getCurrentCycle(hod.id);
    if (!cycle) return res.status(404).json({ message: "No active cycle for this department" });

    const candidates = await Candidate.findAll({
      where: { hodId: hod.id, cycle: cycle.cycle }   // ✅ correct filter
    });

    for (const c of candidates) {
      const recipients = [c.email];
      if (c.secondaryEmail) recipients.push(c.secondaryEmail);
      for (const email of recipients) {
        await sendMail(email, "Recruitment Update", candidateMailTemplate(c.fullName));
      }
    }

    res.json({ success: true, count: candidates.length });
  } catch (err) {
    res.status(500).json({ message: "Email failed" });
  }
};

exports.emailAllExperts = async (req, res) => {
  try {
    const { hodId } = req.params;

    // ✅ get cycle dynamically:
    const cycle = await getCurrentCycle(parseInt(hodId));
    if (!cycle) return res.status(404).json({ message: "No active cycle" });

    const experts = await Expert.findAll({
      where: { uploadedById: hodId, cycle: cycle.cycle }   // ✅ fixed
    });

    if (!experts.length) return res.status(404).json({ message: "No experts found" });

    for (const e of experts) {
      await sendMail(e.email, "Interview Invitation", exports.expertMailTemplate(e.fullName));
    }

    res.json({ success: true, count: experts.length });
  } catch (err) {
    res.status(500).json({ message: "Email failed" });
  }
};


/* ============================
   REMINDER
============================ */
exports.sendCandidateReminder = async (req, res) => {
  const app = await CandidateApplication.findByPk(req.params.id);

  if (!app)
    return res.status(404).json({ message: "Application not found" });

  await sendMail(
    app.email,
    "Reminder",
    "Please complete missing documents"
  );

  res.json({ message: "Reminder sent" });
};