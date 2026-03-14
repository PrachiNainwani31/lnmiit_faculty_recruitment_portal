const transporter = require("../config/mailer");
const User = require("../models/User");
const Candidate = require("../models/Candidate");
const Expert = require("../models/Expert");
const CYCLE = require("../config/activeCycle");
const CandidateApplication = require("../models/CandidateApplication")

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
    const dofa = await User.findOne({ role: "DOFA" });

    if (!dofa) {
      console.log("DOFA not found");
      return;
    }

    await sendMail(
      dofa.email,
      "HOD Uploaded Experts",
      `
      <p>HOD <b>${hodName}</b> from <b>${department}</b> has uploaded experts.</p>
      <p>Please review them on the portal.</p>
      `
    );

  } catch (err) {
    console.error("notifyDofaUpload error:", err);
  }
};

/* ============================
   DOFA comment mail to HOD
============================ */
exports.notifyHodComment = async (hodEmail) => {
  sendMail(
    hodEmail,
    "New Comment from DOFA",
    `<p>DOFA has raised a comment. Please check the portal.</p>`
  );
};

/* =================================================
   TEMPLATE FUNCTIONS (define first)
================================================= */

function candidateMailTemplate(candidateName) {
  return `
  <div style="background:#f4f6f9;padding:40px;font-family:Arial">
    <table align="center" width="600" style="background:#fff;border-radius:8px;padding:30px">
      <tr>
        <td style="background:#8b0000;color:#fff;padding:15px;text-align:center">
          <h2 style="margin:0">LNMIIT Recruitment Portal</h2>
        </td>
      </tr>
      <tr>
        <td style="padding:25px;color:#333;line-height:1.6">
          <p>Dear <strong>${candidateName}</strong>,</p>

          <p>
            You are shortlisted for interview. Please upload the following documents on the Recruitment Portal:
            </p>

            <ul>
            <li>Letter of Acceptance</li>
            <li>Five Best Publications</li>
            <li>Teaching Statement</li>
            <li>Research Statement</li>
            <li>Education Certificates</li>
            <li>Experience Certificate (if any)</li>
            <li>Provisional PhD Degree Certificate</li>
            <li>List of Three Referees</li>
            <li>Accommodation Requirement</li>
            <li>Contact Number</li>
            </ul>

          <p>
            Kindly complete the process at the earliest.
          </p>

          <p style="margin-top:30px">
            Best regards,<br>
            <strong>Webmaster LNMIIT</strong><br>
            webmaster@lnmiit.ac.in
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;
}

exports.expertMailTemplate = (expertName) => {
  return `
  <div style="background:#f4f6f9;padding:40px;font-family:Arial">
    <table align="center" width="600" style="background:#fff;border-radius:8px;padding:30px">
      <tr>
        <td style="background:#8b0000;color:#fff;padding:15px;text-align:center">
          <h2 style="margin:0">LNMIIT Recruitment Portal</h2>
        </td>
      </tr>
      <tr>
        <td style="padding:25px;color:#333;line-height:1.6">
          <p>Dear <strong>${expertName}</strong>,</p>

          <p>
            We wish to invite you as an expert for the upcoming faculty recruitment interview process at 
            <strong>The LNM Institute of Information Technology</strong>.
          </p>

          <p>
            Kindly reply to this email confirming whether you will be able to attend the interview.
          </p>

          <p style="margin-top:30px">
            Best regards,<br>
            <strong>Webmaster LNMIIT</strong><br>
            webmaster@lnmiit.ac.in
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;
}

/* =================================================
   SEND SINGLE CANDIDATE MAIL
================================================= */

exports.emailCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });

    await transporter.sendMail({
      from: `"LNMIIT Recruitment" <${process.env.EMAIL_USER}>`,
      to: candidate.email,
      subject: "Recruitment Application Update",
      html: candidateMailTemplate(candidate.fullName),
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Email failed" });
  }
};

/* =================================================
   SEND ALL CANDIDATES (DEPARTMENT)
================================================= */

exports.emailAllCandidates = async (req, res) => {
  try {
    const department = req.params.dept;

    const hod = await User.findOne({ role: "HOD", department });
    if (!hod)
      return res.status(404).json({ message: "HOD not found" });

    const candidates = await Candidate.find({
      hod: hod._id,
      cycle: CYCLE,
    });

    for (const candidate of candidates) {
      transporter.sendMail({
        from: `"LNMIIT Recruitment" <${process.env.EMAIL_USER}>`,
        to: candidate.email,
        subject: "Recruitment Application Update",
        html: candidateMailTemplate(candidate.fullName),
      });
    }

    res.json({ success: true, count: candidates.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Email failed" });
  }
};

/* =================================================
   SEND ALL EXPERTS
================================================= */
exports.emailAllExperts = async (req, res) => {
  try {
    const { hodId } = req.params;

    const experts = await Expert.find({
      uploadedBy: hodId,
      cycle: CYCLE,
    });

    if (!experts.length) {
      return res.status(404).json({ message: "No experts found for this HOD" });
    }

    experts.forEach(expert => {
      transporter.sendMail({
        from: `"LNMIIT Recruitment" <${process.env.EMAIL_USER}>`,
        to: expert.email,
        subject: "Interview Invitation – LNMIIT",
        html: exports.expertMailTemplate(expert.fullName),
      }).catch(err => console.error("Email error:", err));
    });

    res.json({ success: true, count: experts.length });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Email failed" });
  }
};

exports.sendCandidateReminder = async(req,res)=>{

const app = await CandidateApplication.findById(req.params.id);

await sendEmail(
app.candidateEmail,
"Reminder: Complete Faculty Application",
"Please complete missing documents."
);

res.json({message:"Reminder sent"});
};