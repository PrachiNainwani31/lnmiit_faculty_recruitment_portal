const { CandidateApplication, CandidateReferee, CandidateExperience } = require("../models");
const { sendEmail } = require("../utils/emailSender");

/* =====================================================
   HELPER — get or create application
===================================================== */
const getOrCreateApp = async (userId, email) => {
  let app = await CandidateApplication.findOne({
    where: { candidateUserId: userId },
  });

  if (!app) {
    app = await CandidateApplication.create({
      candidateUserId: userId,
      email,
    });
  }

  return app;
};

/* =====================================================
   GET MY APPLICATION
   Returns app + child referees + experiences
===================================================== */
exports.getMyApplication = async (req, res) => {
  try {
    let app = await CandidateApplication.findOne({
      where: { candidateUserId: req.user.id },
      include: [
        { model: CandidateReferee,    as: "referees",    required: false },
        { model: CandidateExperience, as: "experiences", required: false },
      ],
    });

    if (!app) {
      app = await CandidateApplication.create({
        candidateUserId: req.user.id,
        email: req.user.email,
      });

      // Re-fetch with includes so response shape is consistent
      app = await CandidateApplication.findByPk(app.id, {
        include: [
          { model: CandidateReferee,    as: "referees",    required: false },
          { model: CandidateExperience, as: "experiences", required: false },
        ],
      });
    }

    res.json(app);

  } catch (err) {
    console.error("getMyApplication error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   SAVE DRAFT
   Handles flat fields + child table sync for
   referees and experiences
===================================================== */
exports.saveDraft = async (req, res) => {
  try {
    const app = await getOrCreateApp(req.user.id, req.user.email);

    // ── Flat fields ────────────────────────────────────────────────
    const updateData = {};

    if (req.body.name        !== undefined) updateData.name          = req.body.name;
    if (req.body.email       !== undefined) updateData.email         = req.body.email;
    if (req.body.contact     !== undefined) updateData.phone         = req.body.contact;
    if (req.body.acceptance  !== undefined) updateData.acceptance    = req.body.acceptance;
    if (req.body.accommodation !== undefined) updateData.accommodation = req.body.accommodation;
    if (req.body.department  !== undefined) updateData.department    = req.body.department;

    // Publications stays as JSON column (array of strings — no child table needed)
    if (req.body.publications !== undefined) updateData.publications = req.body.publications;

    // Experience type flags
    if (req.body.expResearch   !== undefined) updateData.expResearch   = req.body.expResearch;
    if (req.body.expTeaching   !== undefined) updateData.expTeaching   = req.body.expTeaching;
    if (req.body.expIndustrial !== undefined) updateData.expIndustrial = req.body.expIndustrial;

    if (Object.keys(updateData).length) {
      await CandidateApplication.update(updateData, { where: { id: app.id } });
    }

    // ── Referees — sync child table ────────────────────────────────
    // req.body.referees = array of { id?, salutation, name, designation, department, institute, email }
    if (Array.isArray(req.body.referees)) {
      for (const r of req.body.referees) {
        if (r.id) {
          // Update existing row
          await CandidateReferee.update(
            {
              salutation:  r.salutation,
              name:        r.name,
              designation: r.designation,
              department:  r.department,
              institute:   r.institute,
              email:       r.email,
            },
            { where: { id: r.id, applicationId: app.id } }
          );
        } else {
          // Insert new row
          await CandidateReferee.create({
            applicationId: app.id,
            salutation:    r.salutation,
            name:          r.name,
            designation:   r.designation,
            department:    r.department,
            institute:     r.institute,
            email:         r.email,
            status:        "PENDING",
          });
        }
      }
    }

    // ── Experiences — sync child table ─────────────────────────────
    // req.body.experiences = array of { id?, type, organization, designation, department, fromDate, toDate, natureOfWork }
    if (Array.isArray(req.body.experiences)) {
      for (const e of req.body.experiences) {
        if (e.id) {
          await CandidateExperience.update(
            {
              type:         e.type,
              organization: e.organization,
              designation:  e.designation,
              department:   e.department,
              fromDate:     e.fromDate ? new Date(e.fromDate) : null,
              toDate:       e.toDate   ? new Date(e.toDate)   : null,
              natureOfWork: e.natureOfWork,
            },
            { where: { id: e.id, applicationId: app.id } }
          );
        } else {
          await CandidateExperience.create({
            applicationId: app.id,
            type:          e.type,
            organization:  e.organization,
            designation:   e.designation,
            department:    e.department,
            fromDate:      e.fromDate ? new Date(e.fromDate) : null,
            toDate:        e.toDate   ? new Date(e.toDate)   : null,
            natureOfWork:  e.natureOfWork,
          });
        }
      }
    }

    // Return full updated app with children
    const updatedApp = await CandidateApplication.findByPk(app.id, {
      include: [
        { model: CandidateReferee,    as: "referees",    required: false },
        { model: CandidateExperience, as: "experiences", required: false },
      ],
    });

    res.json(updatedApp);

  } catch (err) {
    console.error("saveDraft error:", err.message);
    res.status(500).json({ message: "Failed to save draft" });
  }
};

/* =====================================================
   DELETE REFEREE
   Candidate removes a referee before submission
===================================================== */
exports.deleteReferee = async (req, res) => {
  try {
    const app = await CandidateApplication.findOne({
      where: { candidateUserId: req.user.id },
    });

    if (!app)
      return res.status(404).json({ message: "Application not found" });

    await CandidateReferee.destroy({
      where: { id: req.params.refereeId, applicationId: app.id },
    });

    res.json({ success: true });

  } catch (err) {
    console.error("deleteReferee error:", err.message);
    res.status(500).json({ message: "Failed to delete referee" });
  }
};

/* =====================================================
   DELETE EXPERIENCE
===================================================== */
exports.deleteExperience = async (req, res) => {
  try {
    const app = await CandidateApplication.findOne({
      where: { candidateUserId: req.user.id },
    });

    if (!app)
      return res.status(404).json({ message: "Application not found" });

    await CandidateExperience.destroy({
      where: { id: req.params.experienceId, applicationId: app.id },
    });

    res.json({ success: true });

  } catch (err) {
    console.error("deleteExperience error:", err.message);
    res.status(500).json({ message: "Failed to delete experience" });
  }
};

/* =====================================================
   SUBMIT APPLICATION
   Marks as SUBMITTED + sends email to all referees
===================================================== */
exports.submitApplication = async (req, res) => {
  try {
    const app = await CandidateApplication.findOne({
      where: { candidateUserId: req.user.id },
    });

    if (!app)
      return res.status(404).json({ message: "Application not found" });

    if (app.status === "SUBMITTED")
      return res.status(400).json({ message: "Application already submitted" });

    await CandidateApplication.update(
      { status: "SUBMITTED" },
      { where: { id: app.id } }
    );

    // Fetch referees from child table
    const referees = await CandidateReferee.findAll({
      where: { applicationId: app.id },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    for (const referee of referees) {
      if (!referee.email) continue;

      const portalLink = `${frontendUrl}/referee/${referee.id}`;

      await sendEmail(
        referee.email,
        `Reference Letter Request — ${app.name}`,
        `<p>Dear ${referee.name},</p>
         <p><strong>${app.name}</strong> has applied for a faculty position at LNMIIT
         and has listed you as a referee.</p>
         <p>Please submit your reference letter here:
         <a href="${portalLink}">Submit Reference Letter</a></p>
         <p>Regards,<br>DOFA Office, LNMIIT</p>`
      ).catch(err =>
        console.error(`Referee email failed for ${referee.email}:`, err.message)
      );
    }

    res.json({ message: "Application submitted successfully" });

  } catch (err) {
    console.error("submitApplication error:", err.message);
    res.status(500).json({ message: "Submission failed" });
  }
};

/* =====================================================
   REMIND REFEREE (from candidate portal)
===================================================== */
exports.remindReferee = async (req, res) => {
  try {
    const { id: refereeId } = req.params;

    const referee = await CandidateReferee.findByPk(refereeId);

    if (!referee)
      return res.status(404).json({ message: "Referee not found" });

    // Security: ensure this referee belongs to the logged-in candidate
    const app = await CandidateApplication.findOne({
      where: { candidateUserId: req.user.id },
    });

    if (!app || referee.applicationId !== app.id)
      return res.status(403).json({ message: "Access denied" });

    if (referee.status === "SUBMITTED")
      return res.status(400).json({ message: "Already submitted" });

    const portalLink = `${process.env.FRONTEND_URL}/referee/${refereeId}`;

    await sendEmail(
      referee.email,
      `Reminder — Reference Letter for ${app.name}`,
      `<p>Dear ${referee.name},</p>
       <p>This is a gentle reminder to submit the reference letter for
       <strong>${app.name}</strong>.</p>
       <p><a href="${portalLink}">Submit Reference Letter</a></p>
       <p>Regards,<br>LNMIIT Recruitment Portal</p>`
    );

    res.json({ message: "Reminder sent" });

  } catch (err) {
    console.error("remindReferee error:", err.message);
    res.status(500).json({ message: "Failed to send reminder" });
  }
};

/* =====================================================
   UPLOAD DOCUMENT
   Single file upload — updates named column on app
===================================================== */
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "File required" });

    const type     = req.body.type;     // e.g. "docCv", "docGraduation"
    const filePath = req.file.path;

    const app = await getOrCreateApp(req.user.id, req.user.email);

    // Validate column name to prevent arbitrary column injection
    const ALLOWED_DOC_COLUMNS = [
      "docCv", "docTeachingStatement", "docResearchStatement",
      "docMarks10", "docMarks12", "docGraduation", "docPostGraduation",
      "docPhdCourseWork", "docPhdProvisional", "docPhdDegree",
    ];

    if (!ALLOWED_DOC_COLUMNS.includes(type))
      return res.status(400).json({ message: `Unknown document type: ${type}` });

    await CandidateApplication.update(
      { [type]: filePath },
      { where: { id: app.id } }
    );

    res.json({ success: true, path: filePath });

  } catch (err) {
    console.error("uploadDocument error:", err.message);
    res.status(500).json({ message: "Upload failed" });
  }
};

/* =====================================================
   UPLOAD MULTI-FILE DOCUMENT
   Appends to a JSON array column (e.g. docBestPapers)
===================================================== */
exports.uploadMultiDocument = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "File required" });

    const type     = req.body.type;
    const filePath = req.file.path;

    const ALLOWED_MULTI_COLUMNS = [
      "docResearchExpCerts", "docTeachingExpCerts", "docIndustryExpCerts",
      "docBestPapers", "docPostDocDocs", "docSalarySlips", "docOtherDocs",
    ];

    if (!ALLOWED_MULTI_COLUMNS.includes(type))
      return res.status(400).json({ message: `Unknown document type: ${type}` });

    const app = await getOrCreateApp(req.user.id, req.user.email);

    const existing = app[type] || [];
    existing.push({ path: filePath, name: req.body.name || req.file.originalname });

    await CandidateApplication.update(
      { [type]: existing },
      { where: { id: app.id } }
    );

    res.json({ success: true, path: filePath });

  } catch (err) {
    console.error("uploadMultiDocument error:", err.message);
    res.status(500).json({ message: "Upload failed" });
  }
};