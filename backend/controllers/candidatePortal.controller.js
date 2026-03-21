const CandidateApplication = require("../models/CandidateApplication");
const { sendEmail } = require("../utils/emailSender");

exports.getMyApplication = async (req, res) => {
  let app = await CandidateApplication.findOne({ candidate: req.user._id });
  if (!app) {
    app = await CandidateApplication.create({
      candidate: req.user._id,
      email: req.user.email,
    });
  }
  res.json(app);
};

/* ─────────────────────────────────────────
   SAVE DRAFT
   FIX: merge referees by index so Mongoose
   keeps existing _ids instead of creating new ones
───────────────────────────────────────── */
exports.saveDraft = async (req, res) => {
  let app = await CandidateApplication.findOne({ candidate: req.user._id });
  if (!app) {
    app = await CandidateApplication.create({
      candidate: req.user._id,
      email: req.user.email,
    });
  }

  if (req.body.name          !== undefined) app.name          = req.body.name;
  if (req.body.email         !== undefined) app.email         = req.body.email;
  if (req.body.contact       !== undefined) app.phone         = req.body.contact;
  if (req.body.acceptance    !== undefined) app.acceptance    = req.body.acceptance;
  if (req.body.accommodation !== undefined) app.accommodation = req.body.accommodation;
  if (req.body.documents     !== undefined) app.documents     = req.body.documents;
  if (req.body.publications  !== undefined) app.publications  = req.body.publications;
  if (req.body.experiences   !== undefined) app.experiences   = req.body.experiences;

  // FIX: merge referees preserving existing _ids
  // instead of replacing the whole array (which creates new _ids)
  if (req.body.referees !== undefined) {
    const incoming = req.body.referees || [];
    const existing = app.referees || [];

    const merged = incoming.map((r, i) => {
      const existingRef = existing[i];
      if (existingRef && existingRef._id) {
        // update fields but keep the same subdoc _id
        existingRef.name        = r.name        ?? existingRef.name;
        existingRef.designation = r.designation ?? existingRef.designation;
        existingRef.department  = r.department  ?? existingRef.department;
        existingRef.institute   = r.institute   ?? existingRef.institute;
        existingRef.email       = r.email       ?? existingRef.email;
        return existingRef;
      }
      // new referee — Mongoose will assign a fresh _id
      return r;
    });

    app.referees = merged;
    app.markModified("referees");
  }

  await app.save();
  res.json(app);
};

/* ─────────────────────────────────────────
   SUBMIT APPLICATION
   Re-fetch after save so subdoc _ids exist
───────────────────────────────────────── */
exports.submitApplication = async (req, res) => {
  const app = await CandidateApplication.findOne({ candidate: req.user._id });
  if (!app) return res.status(404).json({ message: "Application not found" });

  app.status = "SUBMITTED";
  await app.save();

  // Re-fetch so Mongoose subdoc _ids are populated
  const savedApp = await CandidateApplication.findById(app._id);
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  for (const r of savedApp.referees) {
    if (!r.email || !r._id) continue;

    const portalLink = `${frontendUrl}/referee/${r._id}`;

    await sendEmail(
      r.email,
      `Reference Letter Request — ${savedApp.name} (LNMIIT Recruitment)`,
      `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
        <div style="background:#8b0000;color:#fff;padding:15px;text-align:center;border-radius:6px 6px 0 0">
          <h2 style="margin:0">LNMIIT Recruitment Portal</h2>
        </div>
        <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
          <p>Dear <strong>${r.name}</strong>,</p>
          <p><strong>${savedApp.name}</strong> has listed you as a referee for faculty recruitment at LNMIIT.</p>
          <p style="text-align:center;margin:25px 0">
            <a href="${portalLink}"
              style="background:#8b0000;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px">
              Submit Reference Letter
            </a>
          </p>
          <p style="font-size:12px;color:#666">Or copy this link: ${portalLink}</p>
          <p>Best regards,<br><strong>Webmaster LNMIIT</strong><br>webmaster@lnmiit.ac.in</p>
        </div>
      </div>
      `
    ).catch(err => console.error("Referee email failed:", err.message));
  }

  res.json({ message: "Application submitted" });
};

exports.remindReferee = async (req, res) => {
  const app = await CandidateApplication.findOne({ "referees._id": req.params.id });
  if (!app) return res.status(404).json({ message: "Not found" });
  const referee = app.referees.id(req.params.id);
  await sendEmail(
    referee.email,
    "Reminder for Reference Letter",
    "Gentle reminder to upload your reference letter."
  );
  res.json({ message: "Reminder sent" });
};

exports.uploadDocument = async (req, res) => {
  const userId   = req.user._id;
  const type     = req.body.type;
  const filePath = req.file.path;

  let app = await CandidateApplication.findOne({ candidate: userId });
  if (!app) app = new CandidateApplication({ candidate: userId });

  if (!app.documents) app.documents = {};
  app.documents[type] = filePath;
  app.markModified("documents");
  await app.save();

  res.json({ success: true, path: filePath });
};