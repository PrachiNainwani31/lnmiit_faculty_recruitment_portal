const { CandidateApplication, CandidateReferee } = require("../models");
const { sendEmail } = require("../utils/emailSender");

/* =====================================================
   GET REFEREE INFO
   Public route — referee opens their portal link
   /referee/:refereeId  (no auth required)
===================================================== */
exports.getRefereeInfo = async (req, res) => {
  try {
    const { refereeId } = req.params;

    // ✅ Direct DB lookup — no more scanning all applications
    const referee = await CandidateReferee.findByPk(refereeId);

    if (!referee)
      return res.status(404).json({ message: "Invalid or expired link" });

    const app = await CandidateApplication.findByPk(referee.applicationId);

    if (!app)
      return res.status(404).json({ message: "Application not found" });

    res.json({
      refereeId: referee.id,
      candidateName: app.name,
      refereeName: referee.name,
      refereeEmail: referee.email,
      status: referee.status,
      alreadySubmitted: referee.status === "SUBMITTED",
    });

  } catch (err) {
    console.error("getRefereeInfo error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   UPLOAD REFERENCE LETTER
   Public route — referee submits their letter
===================================================== */
exports.uploadReferenceLetter = async (req, res) => {
  try {
    const { refereeId } = req.params;
    const { signedName } = req.body;

    if (!req.file)
      return res.status(400).json({ message: "PDF file required" });

    const referee = await CandidateReferee.findByPk(refereeId);

    if (!referee)
      return res.status(404).json({ message: "Invalid link" });

    if (referee.status === "SUBMITTED")
      return res.status(400).json({ message: "Reference already submitted" });

    // ✅ Update the child row directly
    await CandidateReferee.update(
      {
        letter:      req.file.path,
        signedName,
        status:      "SUBMITTED",
        submittedAt: new Date(),
      },
      { where: { id: refereeId } }
    );

    // Notify candidate
    const app = await CandidateApplication.findByPk(referee.applicationId);

    if (app?.email) {
      await sendEmail(
        app.email,
        "Reference Letter Submitted",
        `<p>Dear ${app.name || "Candidate"},</p>
         <p><strong>${referee.name}</strong> has submitted your reference letter.</p>
         <p>Regards,<br>LNMIIT Recruitment Portal</p>`
      ).catch(err => console.error("Referee notify email failed:", err.message));
    }

    res.json({ success: true });

  } catch (err) {
    console.error("uploadReferenceLetter error:", err.message);
    res.status(500).json({ message: "Upload failed" });
  }
};

/* =====================================================
   GET REFEREE STATUS
   Candidate checks status of their own referees
===================================================== */
exports.getRefereeStatus = async (req, res) => {
  try {
    const app = await CandidateApplication.findOne({
      where: { candidateUserId: req.user.id },
    });

    if (!app)
      return res.status(404).json({ message: "Application not found" });

    // ✅ Query child table
    const referees = await CandidateReferee.findAll({
      where: { applicationId: app.id },
      order: [["id", "ASC"]],
    });

    const statuses = referees.map(r => ({
      id:          r.id,
      salutation:  r.salutation,
      name:        r.name,
      designation: r.designation,
      department:  r.department,
      institute:   r.institute,
      email:       r.email,
      status:      r.status || "PENDING",
      submittedAt: r.submittedAt || null,
      letterPath:  r.letter || null,
    }));

    res.json(statuses);

  } catch (err) {
    console.error("getRefereeStatus error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   SEND REFEREE REMINDER
   Candidate sends reminder to a specific referee
===================================================== */
exports.sendRefereeReminder = async (req, res) => {
  try {
    const { refereeId } = req.params;

    const referee = await CandidateReferee.findByPk(refereeId);

    if (!referee)
      return res.status(404).json({ message: "Referee not found" });

    if (referee.status === "SUBMITTED")
      return res.status(400).json({ message: "Reference already submitted" });

    const portalLink = `${process.env.FRONTEND_URL}/referee/${refereeId}`;

    // Get candidate name for the email
    const app = await CandidateApplication.findByPk(referee.applicationId);

    await sendEmail(
      referee.email,
      `Reminder — Reference Letter for ${app?.name || "a candidate"}`,
      `<p>Dear ${referee.name},</p>
       <p>This is a gentle reminder that your reference letter for
       <strong>${app?.name || "the candidate"}</strong> is still pending.</p>
       <p>Please submit it at your earliest convenience:
       <a href="${portalLink}">Submit Reference Letter</a></p>
       <p>Regards,<br>LNMIIT Recruitment Portal</p>`
    );

    res.json({ success: true });

  } catch (err) {
    console.error("sendRefereeReminder error:", err.message);
    res.status(500).json({ message: "Failed to send reminder" });
  }
};