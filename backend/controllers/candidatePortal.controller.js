// controllers/candidatePortal.controller.js
const { CandidateApplication, CandidateReferee, CandidateExperience } = require("../models");
const { sendEmail } = require("../utils/emailSender");

/* ── helper ── */
const getOrCreateApp = async (userId, email) => {
  let app = await CandidateApplication.findOne({ where: { candidateUserId: userId } });
  if (!app) app = await CandidateApplication.create({ candidateUserId: userId, email });
  return app;
};

/* ── GET MY APPLICATION ── */
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
        email:           req.user.email,
      });
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

/* ── SAVE DRAFT ──
   IMPORTANT: referees and experiences are FULLY REPLACED on every save.
   This prevents duplicate rows from building up on repeated auto-saves.
   Strategy: DELETE all existing rows for this app, then INSERT the new ones.
── */
exports.saveDraft = async (req, res) => {
  try {
    const app = await getOrCreateApp(req.user.id, req.user.email);

    // ── Flat fields ──────────────────────────────────────────────────────
    const updateData = {};
    if (req.body.name          !== undefined) updateData.name          = req.body.name;
    if (req.body.email         !== undefined) updateData.email         = req.body.email;
    if (req.body.contact       !== undefined) updateData.phone         = req.body.contact;
    if (req.body.acceptance    !== undefined) updateData.acceptance    = req.body.acceptance;
    if (req.body.accommodation !== undefined) updateData.accommodation = req.body.accommodation;
    if (req.body.department    !== undefined) updateData.department    = req.body.department;
    if (req.body.publications  !== undefined) updateData.publications  = req.body.publications;
    if (req.body.expResearch   !== undefined) updateData.expResearch   = req.body.expResearch;
    if (req.body.expTeaching   !== undefined) updateData.expTeaching   = req.body.expTeaching;
    if (req.body.expIndustrial !== undefined) updateData.expIndustrial = req.body.expIndustrial;

    if (Object.keys(updateData).length) {
      await CandidateApplication.update(updateData, { where: { id: app.id } });
    }

    // ── Referees — FULL REPLACE ──────────────────────────────────────────
    // Delete ALL existing, then insert the current list fresh.
    // This prevents duplicates on repeated saves.
    if (Array.isArray(req.body.referees)) {
      await CandidateReferee.destroy({ where: { applicationId: app.id } });

      const refereeRows = req.body.referees
        .filter(r => r.name || r.email) // skip completely empty rows
        .map(r => ({
          applicationId: app.id,
          salutation:    r.salutation  || null,
          name:          r.name        || null,
          designation:   r.designation || null,
          department:    r.department  || null,
          institute:     r.institute   || null,
          email:         r.email       || null,
          status:        r.status      || "PENDING",
          // Preserve existing letter/submission data if it came back from the server
          letter:        r.letter      || null,
          signedName:    r.signedName  || null,
          submittedAt:   r.submittedAt ? new Date(r.submittedAt) : null,
        }));

      if (refereeRows.length > 0) {
        await CandidateReferee.bulkCreate(refereeRows);
      }
    }

    // ── Experiences — FULL REPLACE ───────────────────────────────────────
    if (Array.isArray(req.body.experiences)) {
      await CandidateExperience.destroy({ where: { applicationId: app.id } });

      const expRows = req.body.experiences
        .filter(e => e.organization || e.type) // skip completely empty rows
        .map(e => ({
          applicationId: app.id,
          type:          e.type         || null,
          organization:  e.organization || null,
          designation:   e.designation  || null,
          department:    e.department   || null,
          fromDate:      e.fromDate     ? new Date(e.fromDate) : null,
          // If ongoing, toDate is null (displayed as "Till Date" in UI)
          toDate:        e.ongoing      ? null
                         : e.toDate     ? new Date(e.toDate) : null,
          natureOfWork:  e.natureOfWork || null,
          certificate:   e.certificate  || null,
        }));

      if (expRows.length > 0) {
        await CandidateExperience.bulkCreate(expRows);
      }
    }

    // Return full updated app with fresh children
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

/* ── SUBMIT APPLICATION ── */
exports.submitApplication = async (req, res) => {
  try {
    const app = await CandidateApplication.findOne({
      where: { candidateUserId: req.user.id },
    });

    if (!app)
      return res.status(404).json({ message: "Application not found" });

    if (app.status === "SUBMITTED")
      return res.status(400).json({ message: "Application already submitted" });

    await CandidateApplication.update({ status: "SUBMITTED" }, { where: { id: app.id } });

    const referees = await CandidateReferee.findAll({ where: { applicationId: app.id } });
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
      ).catch(err => console.error(`Referee email failed for ${referee.email}:`, err.message));
    }

    res.json({ message: "Application submitted successfully" });

  } catch (err) {
    console.error("submitApplication error:", err.message);
    res.status(500).json({ message: "Submission failed" });
  }
};

/* ── REMIND REFEREE ── */
exports.remindReferee = async (req, res) => {
  try {
    const { id: refereeId } = req.params;
    const referee = await CandidateReferee.findByPk(refereeId);
    if (!referee) return res.status(404).json({ message: "Referee not found" });

    const app = await CandidateApplication.findOne({ where: { candidateUserId: req.user.id } });
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

/* ── UPLOAD DOCUMENT ── */
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });

    const type     = req.body.type;
    const filePath = req.file.path;
    const app      = await getOrCreateApp(req.user.id, req.user.email);

    const ALLOWED_DOC_COLUMNS = [
      "docCv", "docTeachingStatement", "docResearchStatement",
      "docMarks10", "docMarks12", "docGraduation", "docPostGraduation",
      "docPhdCourseWork", "docPhdProvisional", "docPhdDegree",
    ];

    if (!ALLOWED_DOC_COLUMNS.includes(type))
      return res.status(400).json({ message: `Unknown document type: ${type}` });

    await CandidateApplication.update({ [type]: filePath }, { where: { id: app.id } });

    res.json({ success: true, path: filePath });
  } catch (err) {
    console.error("uploadDocument error:", err.message);
    res.status(500).json({ message: "Upload failed" });
  }
};

/* ── UPLOAD MULTI-FILE DOCUMENT ── */
exports.uploadMultiDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });

    const type     = req.body.type;
    const filePath = req.file.path;

    const ALLOWED_MULTI_COLUMNS = [
      "docResearchExpCerts", "docTeachingExpCerts", "docIndustryExpCerts",
      "docBestPapers", "docPostDocDocs", "docSalarySlips", "docOtherDocs",
    ];

    if (!ALLOWED_MULTI_COLUMNS.includes(type))
      return res.status(400).json({ message: `Unknown document type: ${type}` });

    const app      = await getOrCreateApp(req.user.id, req.user.email);
    const existing = app[type] || [];
    existing.push({ path: filePath, name: req.body.name || req.file.originalname });

    await CandidateApplication.update({ [type]: existing }, { where: { id: app.id } });

    res.json({ success: true, path: filePath });
  } catch (err) {
    console.error("uploadMultiDocument error:", err.message);
    res.status(500).json({ message: "Upload failed" });
  }
};