const { CandidateApplication, CandidateReferee, CandidateExperience, OnboardingRecord } = require("../models");
const { sendEmail }          = require("../utils/emailSender");
const { createNotification } = require("../utils/notify");
const getCurrentCycle = require("../utils/getCurrentCycle");
const { log } = require("../utils/activityLogger");
const templates = require("../utils/emailTemplates");

const getOrCreateApp = async (userId, email) => {
  let app = await CandidateApplication.findOne({ where: { candidateUserId: userId } });
  if (!app) app = await CandidateApplication.create({ candidateUserId: userId, email });
  return app;
};

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

exports.saveDraft = async (req, res) => {
  try {
    const app = await getOrCreateApp(req.user.id, req.user.email);

    // Only allow editing if DRAFT or QUERY (not SUBMITTED)
    if (app.status === "SUBMITTED") {
      return res.status(400).json({ message: "Application already submitted and cannot be edited." });
    }

    const updateData = {};
    if (req.body.name          !== undefined) updateData.name          = req.body.name;
    if (req.body.email         !== undefined) updateData.email         = req.body.email;
    if (req.body.countryCode !== undefined)   updateData.countryCode = req.body.countryCode || "+91";
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

    if (Array.isArray(req.body.referees)) {
  await CandidateReferee.destroy({ where: { applicationId: app.id } });

  // ✅ Deduplicate by email before inserting
  const seen = new Set();
  const refereeRows = req.body.referees
    .filter(r => r.name || r.email)
    .filter(r => {
      const key = (r.email || "").trim().toLowerCase();
      if (!key) return true;       // allow blank email slots
      if (seen.has(key)) return false;  // skip duplicate emails
      seen.add(key);
      return true;
    })
    .map(r => ({
      applicationId: app.id,
      salutation:    r.salutation  || null,
      name:          r.name        || null,
      designation:   r.designation || null,
      department:    r.department  || null,
      institute:     r.institute   || null,
      email:         r.email       || null,
      status:        r.status      || "PENDING",
      letter:        r.letter      || null,
      signedName:    r.signedName  || null,
      submittedAt:   r.submittedAt ? new Date(r.submittedAt) : null,
    }));

  if (refereeRows.length > 0) await CandidateReferee.bulkCreate(refereeRows);
}

    if (Array.isArray(req.body.experiences)) {
  // Delete all existing, re-insert fresh — prevents duplicate accumulation
  await CandidateExperience.destroy({ where: { applicationId: app.id } });

  const expRows = req.body.experiences
    .filter(e => e.type || e.organization)  // skip completely empty rows
    .map(e => ({
      applicationId: app.id,
      type:          e.type         || null,
      organization:  e.organization || null,
      designation:   e.designation  || null,
      department:    e.department   || null,
      fromDate:      e.fromDate     ? new Date(e.fromDate) : null,
      toDate:        e.ongoing      ? null : (e.toDate ? new Date(e.toDate) : null),
      natureOfWork:  e.natureOfWork || null,
      certificate:   e.certificate  || null,
    }));

  if (expRows.length > 0) {
    await CandidateExperience.bulkCreate(expRows);
  }
}

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

exports.submitApplication = async (req, res) => {
  try {
    const app = await CandidateApplication.findOne({
      where: { candidateUserId: req.user.id },
    });
    if (!app) return res.status(404).json({ message: "Application not found" });

    const isResubmit = app.status === "QUERY";
    if (app.status === "SUBMITTED") {
      return res.status(400).json({ message: "Application already submitted" });
    }

    await CandidateApplication.update({ status: "SUBMITTED" }, { where: { id: app.id } });

    const { User } = require("../models");

    if (isResubmit) {
      // Email #7 — candidate resubmitted after remark
      const dofaOfficeUsers = await User.findAll({ where: { role: "DOFA_OFFICE" } });
      const tmpl = templates.candidateResubmitted({
        candidateName: app.name, department: app.department,
      });
      for (const u of dofaOfficeUsers) {
        await sendEmail(u.email, tmpl.subject, tmpl.html).catch(console.error);
      }
      const { RecruitmentCycle } = require("../models");
      const latestCycle = await RecruitmentCycle.findOne({
        order: [["createdAt", "DESC"]],
      });
      const cycleStr = latestCycle?.cycle || "SYSTEM";
            await createNotification({
              cycle: cycleStr, role: "DOFA_OFFICE",
              title: "Candidate Resubmitted Application",
              message: `${app.name} has resubmitted after document corrections.`,
              type: "STATUS",
            });

      await log({
        user:        req.user,
        action:      "APPLICATION_RESUBMITTED",
        entity:      "CandidateApplication",
        entityId:    app.id,
        description: `Application resubmitted for candidate ${app.candidateUserId}`,
        req,
      });
      return res.json({ message: "Application resubmitted successfully." });
    }

    // First submission:

    // Email #5 — notify DOFA Office
    const dofaOfficeUsers = await User.findAll({ where: { role: "DOFA_OFFICE" } });
    const tmpl5 = templates.candidateApplicationSubmitted({
      candidateName: app.name, department: app.department, email: app.email,
    });
    for (const u of dofaOfficeUsers) {
      await sendEmail(u.email, tmpl5.subject, tmpl5.html).catch(console.error);
    }

    // Email #8a — referee invitation emails
    const referees = await CandidateReferee.findAll({ where: { applicationId: app.id } });
    const frontendUrl = process.env.FRINTEND_URL || (req.headers.origin ? req.headers.origin : `${req.protocol}://${req.get("host")}`);
    for (const referee of referees) {
      if (!referee.email) continue;
      const portalLink = `${frontendUrl}referee/${referee.id}`;
      const tmpl = templates.refereeInvitation({
        refereeName:   `${referee.salutation || ""} ${referee.name}`.trim(),
        candidateName: app.name,
        portalLink,
      });
      await sendEmail(referee.email, tmpl.subject, tmpl.html)
        .catch(err => console.error(`Referee email failed for ${referee.email}:`, err.message));
    }

    await log({
  user:        req.user,
  action:      "APPLICATION_SUBMITTED",
  entity:      "CandidateApplication",
  entityId:    app.id,
  description: `Application submitted for candidate ${app.candidateUserId}`,
  req,
});

    res.json({ message: "Application submitted successfully!" });
  } catch (err) {
    console.error("submitApplication error:", err.message);
    res.status(500).json({ message: "Submission failed" });
  }
};

exports.remindReferee = async (req, res) => {
  try {
    const { id: refereeId } = req.params;
    const referee = await CandidateReferee.findByPk(refereeId);
    if (!referee) return res.status(404).json({ message: "Referee not found" });

    const app = await CandidateApplication.findOne({ where: { candidateUserId: req.user.id } });
    if (!app || referee.applicationId !== app.id) return res.status(403).json({ message: "Access denied" });
    if (referee.status === "SUBMITTED") return res.status(400).json({ message: "Already submitted" });

    const baseUrl = process.env.FRONTEND_URL || req.headers.origin || `${req.protocol}://${req.get("host")}`;
    const portalLink = `${baseUrl}referee/${refereeId}`
    const tmpl = templates.refereeReminder({
      refereeName:   `${referee.salutation || ""} ${referee.name}`.trim(),
      candidateName: app.name,
      portalLink,
    });
    await sendEmail(referee.email, tmpl.subject, tmpl.html);
    res.json({ message: "Reminder sent" });
  } catch (err) {
    console.error("remindReferee error:", err.message);
    res.status(500).json({ message: "Failed to send reminder" });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });

    const type     = req.body.type;
    const filePath = req.file.path;
    const app      = await getOrCreateApp(req.user.id, req.user.email);

    const ALLOWED_DOC_COLUMNS = [
      "docCv","docTeachingStatement","docResearchStatement",
      "docMarks10","docMarks12","docGraduation","docPostGraduation",
      "docPhdCourseWork","docPhdProvisional","docPhdDegree",
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

exports.uploadMultiDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });

    const type     = req.body.type;
    const filePath = req.file.path;

    const ALLOWED_MULTI_COLUMNS = [
      "docResearchExpCerts","docTeachingExpCerts","docIndustryExpCerts",
      "docBestPapers","docPostDocDocs","docSalarySlips","docOtherDocs",
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

exports.uploadExperienceCertificate = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });

    const { id } = req.params;
    const app = await CandidateApplication.findOne({ where: { candidateUserId: req.user.id } });
    if (!app) return res.status(404).json({ message: "Application not found" });

    const exp = await CandidateExperience.findOne({ where: { id, applicationId: app.id } });
    if (!exp) return res.status(404).json({ message: "Experience not found" });

    await CandidateExperience.update({ certificate: req.file.path }, { where: { id: exp.id, applicationId: app.id } });
    res.json({ success: true, path: req.file.path });
  } catch (err) {
    console.error("uploadExperienceCertificate error:", err.message);
    res.status(500).json({ message: "Upload failed" });
  }
};

/* ──  NEW: Candidate submits their preferred joining date ── */
exports.submitJoiningDate = async (req, res) => {
  try {
    const { joiningDate } = req.body;
    if (!joiningDate) return res.status(400).json({ message: "Joining date required" });

    const Candidate = require("../models/Candidate");
    const candidate = await Candidate.findOne({ where: { email: req.user.email } });
    if (!candidate) return res.status(404).json({ message: "Candidate profile not found" });

    const record = await OnboardingRecord.findOne({ where: { candidateId: candidate.id } });
    if (!record) return res.status(404).json({ message: "Onboarding record not found — selection not published yet" });

    // Store as candidatePreferredJoiningDate (establishment can override with joiningDate)
    await OnboardingRecord.update(
      { candidatePreferredJoiningDate: new Date(joiningDate) },
      { where: { candidateId: candidate.id } }
    );

    const cycle = await getCurrentCycle(req.user.id);

    if (!cycle) {
      return res.status(404).json({ message: "No active cycle found" });
    }
    // Notify establishment
    await createNotification({
      cycle:   cycle.cycle,
      role:    "ESTABLISHMENT",
      title:   "Candidate Submitted Preferred Joining Date",
      message: `${candidate.fullName || "A candidate"} has submitted their preferred joining date: ${new Date(joiningDate).toLocaleDateString("en-GB")}.`,
      type:    "STATUS",
    });

    res.json({ success: true });
  } catch (err) {
    console.error("submitJoiningDate error:", err.message);
    res.status(500).json({ message: "Failed to save joining date" });
  }
};