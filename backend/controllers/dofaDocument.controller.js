const { CandidateApplication, CandidateReferee, CandidateExperience } = require("../models");
const { sendEmail } = require("../utils/emailSender");

/* =====================================================
   GET DOCUMENT TRACKING
   DOFA sees all candidates grouped by department,
   with their documents, verdicts, referees, experiences
===================================================== */
exports.getDocumentTracking = async (req, res) => {
  try {
    // ✅ Include child tables in the query
    const applications = await CandidateApplication.findAll({
      include: [
        {
          model: CandidateReferee,
          as: "referees",
          required: false,
        },
        {
          model: CandidateExperience,
          as: "experiences",
          required: false,
        },
      ],
    });

    const deptMap = {};

    applications
      .filter(app => app.name || app.email)
      .forEach(app => {
        const dept = app.department || "General";

        if (!deptMap[dept]) {
          deptMap[dept] = { department: dept, candidates: [] };
        }

        // Build document status map from individual columns
        const documents = {
          cv:                app.docCv                || null,
          teachingStatement: app.docTeachingStatement || null,
          researchStatement: app.docResearchStatement || null,
          marks10:           app.docMarks10           || null,
          marks12:           app.docMarks12           || null,
          graduation:        app.docGraduation        || null,
          postGraduation:    app.docPostGraduation    || null,
          phdCourseWork:     app.docPhdCourseWork     || null,
          phdProvisional:    app.docPhdProvisional    || null,
          phdDegree:         app.docPhdDegree         || null,
          // Multi-file
          researchExpCerts:  app.docResearchExpCerts  || [],
          teachingExpCerts:  app.docTeachingExpCerts  || [],
          industryExpCerts:  app.docIndustryExpCerts  || [],
          bestPapers:        app.docBestPapers        || [],
          otherDocs:         app.docOtherDocs         || [],
        };

        deptMap[dept].candidates.push({
          id:            app.id,
          name:          app.name          || "—",
          email:         app.email         || "—",
          phone:         app.phone         || "—",
          status:        app.status        || "DRAFT",
          acceptance:    app.acceptance,
          accommodation: app.accommodation,
          documents,
          verdicts:      app.verdicts      || {},
          publications:  app.publications  || [],
          // ✅ Now populated from child tables
          referees:      (app.referees || []).map(r => ({
            id:          r.id,
            salutation:  r.salutation,
            name:        r.name,
            designation: r.designation,
            department:  r.department,
            institute:   r.institute,
            email:       r.email,
            status:      r.status,
            submittedAt: r.submittedAt,
            letterPath:  r.letter,
          })),
          experiences: (app.experiences || []).map(e => ({
            id:           e.id,
            type:         e.type,
            organization: e.organization,
            designation:  e.designation,
            department:   e.department,
            fromDate:     e.fromDate,
            toDate:       e.toDate,
            natureOfWork: e.natureOfWork,
            certificate:  e.certificate,
          })),
        });
      });

    res.json(Object.values(deptMap));

  } catch (err) {
    console.error("getDocumentTracking error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   UPDATE DOCUMENT VERDICT
   DOFA marks a document as OK / Incorrect / Missing
===================================================== */
exports.updateDocumentVerdict = async (req, res) => {
  try {
    const { appId, doc, status, remark } = req.body;

    const app = await CandidateApplication.findByPk(appId);

    if (!app)
      return res.status(404).json({ message: "Application not found" });

    const verdicts = app.verdicts || {};
    verdicts[doc]  = { status, remark };

    await CandidateApplication.update(
      { verdicts },
      { where: { id: appId } }
    );

    res.json({ success: true });

  } catch (err) {
    console.error("updateDocumentVerdict error:", err.message);
    res.status(500).json({ message: "Failed to update verdict" });
  }
};

/* =====================================================
   SEND REMINDER TO CANDIDATE
   DOFA sends reminder about missing/incorrect docs
===================================================== */
exports.sendReminder = async (req, res) => {
  try {
    const { candidateId } = req.body;

    const app = await CandidateApplication.findByPk(candidateId);

    if (!app)
      return res.status(404).json({ message: "Application not found" });

    if (!app.email)
      return res.status(400).json({ message: "Candidate email not found" });

    // Build issues list from verdicts
    const issues = [];

    Object.entries(app.verdicts || {}).forEach(([doc, val]) => {
      if (val?.status === "Incorrect" || val?.status === "Missing") {
        issues.push(
          `<li><strong>${doc}</strong> — ${val.status}` +
          `${val.remark ? ` <em>(${val.remark})</em>` : ""}</li>`
        );
      }
    });

    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

    const issueBlock = issues.length > 0
      ? `<p>The following document(s) require your attention:</p>
         <ul style="color:#8b0000">${issues.join("")}</ul>`
      : `<p>Please ensure all required documents have been uploaded correctly.</p>`;

    await sendEmail(
      app.email,
      "Action Required — Document Submission / Correction",
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
        <div style="background:#8b0000;color:#fff;padding:15px;text-align:center;border-radius:6px 6px 0 0">
          <h2 style="margin:0">LNMIIT Recruitment Portal</h2>
        </div>
        <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
          <p>Date: ${dateStr}</p>
          <p>Dear <strong>${app.name || "Candidate"}</strong>,</p>
          ${issueBlock}
          <p>Please log in to the portal and take action at the earliest.</p>
          <p>Best regards,<br><strong>DOFA Office</strong><br>LNMIIT</p>
        </div>
      </div>`
    );

    res.json({ success: true, message: `Reminder sent to ${app.email}` });

  } catch (err) {
    console.error("sendReminder error:", err.message);
    res.status(500).json({ error: "Failed to send reminder" });
  }
};