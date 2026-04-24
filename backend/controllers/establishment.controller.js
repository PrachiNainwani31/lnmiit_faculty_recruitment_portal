// controllers/establishment.controller.js
const { RecruitmentCycle,OnboardingRecord, Candidate, User } = require("../models");
const { Op } = require("sequelize");
const { sendEmail } = require("../utils/emailSender");
const templates = require("../utils/emailTemplates");
const getCurrentCycle = require("../utils/getCurrentCycle");
const { log } = require("../utils/activityLogger");
const BASE_URL = process.env.FRONTEND_URL ;
const checkCycleLocked = async (candidateId) => {
  const { OnboardingRecord, RecruitmentCycle } = require("../models");
  const record = await OnboardingRecord.findOne({ where: { candidateId } });
  if (!record) return false;
  const cycle = await RecruitmentCycle.findOne({
    where: { cycle: record.cycle, hodId: record.hodId },
  });
  return cycle?.isClosed === true;
};
/* ── Get all onboarding records grouped by department ──Includes interviewComplete from SelectedCandidate so Establishment can gate the offer letter upload.── */
exports.getOnboardingRecords = async (req, res) => {
  try {
    const role = req.user.role;
    const { SelectedCandidate } = require("../models");
    const { Op } = require("sequelize");
    const activeCycles = await RecruitmentCycle.findAll({
  attributes: ["cycle", "hodId"],
  where: { [Op.or]: [{ isClosed: false }, { isClosed: null }] },
  order: [["createdAt", "DESC"]],
});
// Build a Set of "cycle|hodId" pairs that are active
const activeHodCycleSet = new Set(activeCycles.map(c => `${c.cycle}|${c.hodId}`));
const cycleStrings = [...new Set(activeCycles.map(c => c.cycle))];
const records = await OnboardingRecord.findAll({
  where: { cycle: cycleStrings },
      include: [
        { model: Candidate, as: "candidate" },
        { model: User,      as: "hod", attributes: ["department", "name", "email"] },
      ],
    });

    const selRecords = await SelectedCandidate.findAll({ where: { cycle: cycleStrings } });
    const selMap = {};
    selRecords.forEach(s => { selMap[s.candidateId] = s; });
    const cycles = await RecruitmentCycle.findAll({
      where: { cycle: cycleStrings },
    });
    const cycleClosedMap = {};
    cycles.forEach(c => { cycleClosedMap[`${c.cycle}|${c.hodId}`] = c.isClosed || false; })
    const deptMap = {};
    records.forEach(r => {
      // Skip records where this HOD's cycle is closed
      if (!activeHodCycleSet.has(`${r.cycle}|${r.hodId}`)) return;
      const dept = r.department || "General";
      if (!deptMap[dept]) deptMap[dept] = [];
      const sel = selMap[r.candidateId];
      const base = {
        ...r.toJSON(),
        interviewComplete: !!(sel),
        selectionStatus:   sel?.status         || "SELECTED",
        waitlistPriority:  sel?.waitlistPriority || null,
        designation:       sel?.designation    || "",
        employmentType:    sel?.employmentType  || "",
        isCycleClosedFlag: cycleClosedMap[`${r.cycle}|${r.hodId}`] || false,
      };
      // Strip fields by role
      if (role === "LUCS") {
        delete base.offerLetterPath;
        delete base.offerLetterUploadedAt;
      }
      if (role === "ESTATE") {
        delete base.offerLetterPath;
        delete base.offerLetterUploadedAt;
        delete base.joiningLetterPath;
      }
      deptMap[dept].push(base);
    });

    res.json(
      Object.entries(deptMap).map(([department, records]) => ({ department, records }))
    );
  } catch (err) {
    console.error("getOnboardingRecords error:", err);
    res.status(500).json({ message: "Failed to fetch records" });
  }
};

/* ── Upload offer letter ── */
exports.uploadOfferLetter = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF required" });
    const { candidateId } = req.body;
    if (await checkCycleLocked(candidateId))
        return res.status(403).json({ message: "Cycle is closed. No changes allowed." });
    await OnboardingRecord.update(
      {
        offerLetterPath:       req.file.path,
        offerLetterUploadedAt: new Date(),
      },
      { where: { candidateId } }
    );

    // ✅ Candidate sees offer letter on portal — no separate email needed per requirements
    const record = await OnboardingRecord.findOne({
      where:   { candidateId },
      include: [{ model: Candidate, as: "candidate" }],
    });

    await log({
      user:        req.user,
      action:      "OFFER_LETTER_UPLOADED",
      entity:      "OnboardingRecord",
      entityId:    candidateId,
      description: `Offer letter uploaded for candidate ${candidateId}`,
      req,
    });

    res.json({ success: true, record });
  } catch (err) {
    console.error("uploadOfferLetter error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

/* ── Set joining date (#12) — email to DOFA, DOFA Office, HOD ── */
exports.setJoiningDate = async (req, res) => {
  try {
    const { candidateId, joiningDate } = req.body;
    if (!joiningDate) return res.status(400).json({ message: "Joining date required" });
    if (await checkCycleLocked(candidateId))
        return res.status(403).json({ message: "Cycle is closed. No changes allowed." });
    await OnboardingRecord.update(
      {
        joiningDate:               new Date(joiningDate),
        joiningDateConfirmedByEst: true,
      },
      { where: { candidateId } }
    );

    const record    = await OnboardingRecord.findOne({ where: { candidateId } });
    const candidate = await Candidate.findByPk(candidateId);
    const fmtDate   = new Date(joiningDate).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

    // Email DOFA + DOFA_OFFICE + this department's HOD
    const recipients = await User.findAll({
      where: { role: ["DOFA", "DOFA_OFFICE"] },
    });
    if (record?.hodId) {
      const hod = await User.findByPk(record.hodId);
      if (hod) recipients.push(hod);
    }

    for (const u of recipients) {
      const tmpl = templates.joiningDateSetEmail({
        candidateName: candidate?.fullName || "—",
        joiningDate:   fmtDate,
        department:    record?.department  || "—",
        recipientName: u.name || u.role,
      });
      await sendEmail(u.email, tmpl.subject, tmpl.html).catch(console.error);
    }

    await log({
      user:        req.user,
      action:      "JOINING_DATE_SET",
      entity:      "OnboardingRecord",
      entityId:    candidateId,
      description: `Joining date set for candidate ${candidateId}`,
      req,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("setJoiningDate error:", err.message);
    res.status(500).json({ message: "Failed to save joining date" });
  }
};

/* ── Upload joining letter (#14) — visible to LUCS, email sent to LUCS ── */
exports.uploadJoiningLetter = async (req, res) => {
  try {
    const { candidateId } = req.body;
    if (!req.file) return res.status(400).json({ message: "File required" });
    if (await checkCycleLocked(candidateId))
      return res.status(403).json({ message: "Cycle is closed. No changes allowed." });

    await OnboardingRecord.update(
      { joiningLetterPath: req.file.path },
      { where: { candidateId } }
    );

    const record    = await OnboardingRecord.findOne({ where: { candidateId } });
    const candidate = await Candidate.findByPk(candidateId);
    const fmtDate   = record?.joiningDate
      ? new Date(record.joiningDate).toLocaleDateString("en-GB")
      : null;

    const lucsUsers = await User.findAll({ where: { role: "LUCS" } });
    const tmpl = templates.joiningLetterToLucs({
      candidateName: candidate?.fullName || "—",
      department:    record?.department  || "—",
      joiningDate:   fmtDate,
    });
    for (const u of lucsUsers) {
      await sendEmail(u.email, tmpl.subject, tmpl.html).catch(console.error);
    }

    await log({
      user:        req.user,
      action:      "JOINING_LETTER_UPLOADED",
      entity:      "OnboardingRecord",
      entityId:    candidateId,
      description: `Joining letter uploaded for candidate ${candidateId}`,
      req,
    });

    res.json({ success: true, path: req.file.path });
  } catch (err) {
    console.error("uploadJoiningLetter error:", err.message);
    res.status(500).json({ message: "Failed to upload" });
  }
};
/* ── Allot room ── */
exports.allotRoom = async (req, res) => {
  try {
    const { candidateId, roomNumber } = req.body;
    if (!roomNumber) return res.status(400).json({ message: "Room number required" });
    if (await checkCycleLocked(candidateId))
        return res.status(403).json({ message: "Cycle is closed. No changes allowed." });
    await OnboardingRecord.update(
      {
        roomNumber,
        roomAllottedAt:   new Date(),
        roomAllottedById: req.user.id,
      },
      { where: { candidateId } }
    );

    const record    = await OnboardingRecord.findOne({ where: { candidateId },
      include: [{ model: Candidate, as: "candidate" }] });
    const candidate = record?.candidate;

    // Email #13 — Estate only
    const estateUsers = await User.findAll({ where: { role: "ESTATE" } });
    const tmpl = templates.roomAllotmentToEstate({
      candidateName: candidate?.fullName || "—",
      roomNumber,
      building: null,
    });
    for (const u of estateUsers) {
      await sendEmail(u.email, tmpl.subject, tmpl.html).catch(console.error);
    }

    res.json({ success: true, record });
  } catch (err) {
    console.error("allotRoom error:", err);
    res.status(500).json({ message: "Failed" });
  }
};

/* ── Save MIS + Library ── */
exports.saveMisLibrary = async (req, res) => {
  try {
    const { candidateId, misLoginDone, libraryDone } = req.body;
    if (!candidateId) return res.status(400).json({ message: "candidateId required" });
    if (await checkCycleLocked(candidateId))
      return res.status(403).json({ message: "Cycle is closed. No changes allowed." });
    const updateData = {
      // Use a placeholder "YES" so the field is non-null when ticked
      misUsername:     misLoginDone ? (req.body.misLoginNote || "YES") : null,
      misProvidedAt:   misLoginDone ? new Date() : null,
      libraryMemberId: libraryDone  ? (req.body.libraryDetails || "YES") : null,
      libraryDoneAt:   libraryDone  ? new Date() : null,
    };

    await OnboardingRecord.update(updateData, { where: { candidateId } });
    res.json({ success: true });
  } catch (err) {
    console.error("saveMisLibrary error:", err.message);
    res.status(500).json({ message: "Failed to save" });
  }
};

/* ── Upload RFID card PDF ── */
exports.uploadRfidCard = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF required" });
    const { candidateId } = req.body;
    if (await checkCycleLocked(candidateId))
        return res.status(403).json({ message: "Cycle is closed. No changes allowed." });
    // Gate: joining letter must exist first
    const record = await OnboardingRecord.findOne({ where: { candidateId } });
    if (!record?.joiningLetterPath)
      return res.status(403).json({ message: "Joining letter must be uploaded first", gated: true });

    await OnboardingRecord.update(
      { rfidPath: req.file.path },
      { where: { candidateId } }
    );

    const updated = await OnboardingRecord.findOne({
      where:   { candidateId },
      include: [{ model: Candidate, as: "candidate" }],
    });

    await log({
      user:        req.user,
      action:      "RFID_SENT",
      entity:      "OnboardingRecord",
      entityId:    candidateId,
      description: `RFID card sent for candidate ${candidateId}`,
      req,
    });
    res.json({ success: true, record: updated });
  } catch (err) {
    console.error("uploadRfidCard error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

/* ── Send RFID to candidate — candidate sees on portal, no extra email per requirements ── */
exports.sendRfidToCandidate = async (req, res) => {
  try {
    const { candidateId } = req.body;
    if (await checkCycleLocked(candidateId))
        return res.status(403).json({ message: "Cycle is closed. No changes allowed." });
    await OnboardingRecord.update(
      { rfidSentToCandidate: true, rfidDoneAt: new Date() },
      { where: { candidateId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};

/* ── Mark joining complete (#15) — email to HOD + DOFA + DOFA Office, freeze record ── */
exports.markJoiningComplete = async (req, res) => {
  try {
    const { candidateId } = req.body;
    if (await checkCycleLocked(candidateId))
        return res.status(403).json({ message: "Cycle is closed. No changes allowed." });
    await OnboardingRecord.update(
      { joiningComplete: true, joiningCompletedAt: new Date() },
      { where: { candidateId } }
    );

    const record    = await OnboardingRecord.findOne({ where: { candidateId } });
    const candidate = await Candidate.findByPk(candidateId);
    const fmtDate   = record?.joiningDate
      ? new Date(record.joiningDate).toLocaleDateString("en-GB")
      : null;

    const recipients = await User.findAll({
      where: { role: ["DOFA", "DOFA_OFFICE"] },
    });
    if (record?.hodId) {
      const hod = await User.findByPk(record.hodId);
      if (hod) recipients.push(hod);
    }

    for (const u of recipients) {
      const tmpl = templates.joiningCompleteEmail({
        candidateName: candidate?.fullName || "—",
        department:    record?.department  || "—",
        joiningDate:   fmtDate,
        recipientName: u.name || u.role,
      });
      await sendEmail(u.email, tmpl.subject, tmpl.html).catch(console.error);
    }
    if (record?.hodId) {
      await RecruitmentCycle.update(
        { joiningComplete: true },
        { where: { hodId: record.hodId, cycle: record.cycle } }
      );
    }

    await log({
      user:        req.user,
      action:      "JOINING_COMPLETE",
      entity:      "OnboardingRecord",
      entityId:    candidateId,
      description: `Joining complete for candidate ${candidateId}`,
      req,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("markJoiningComplete error:", err.message);
    res.status(500).json({ message: "Failed" });
  }
};

exports.closeCycle = async (req, res) => {
  try {
    const { hodId } = req.body;
    if (!hodId) return res.status(400).json({ message: "hodId required" });

    const cycle = await RecruitmentCycle.findOne({
      where: { hodId, [Op.or]: [{ isClosed: false }, { isClosed: null }] },
      order: [["createdAt", "DESC"]],
    });
    if (!cycle) return res.status(404).json({ message: "Cycle not found" });

    await RecruitmentCycle.update(
      { isClosed: true, closedAt: new Date(), closedById: req.user.id, isFrozen: true },
      { where: { id: cycle.id } }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to close cycle" });
  }
};

exports.markNotJoined = async (req, res) => {
  try {
    const { candidateId, reason } = req.body;
    if (await checkCycleLocked(candidateId))
        return res.status(403).json({ message: "Cycle is closed. No changes allowed." });
    await OnboardingRecord.update(
      { joiningComplete: false, notJoined: true, notJoinedReason: reason || null,
        notJoinedAt: new Date() },
      { where: { candidateId } }
    );

    const record    = await OnboardingRecord.findOne({ where: { candidateId } });
    const candidate = await Candidate.findByPk(candidateId);

    // Notify all relevant roles
    const notifyRoles = ["HOD", "DOFA", "DOFA_OFFICE", "LUCS", "ESTATE", "ESTABLISHMENT"];
    const recipients  = await User.findAll({ where: { role: notifyRoles } });
    if (record?.hodId) {
      const hod = await User.findByPk(record.hodId);
      if (hod && !recipients.find(u => u.id === hod.id)) recipients.push(hod);
    }

    for (const u of recipients) {
      await sendEmail(
        u.email,
        `Candidate Did Not Join — ${candidate?.fullName}`,
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
          <div style="background:#8b0000;color:#fff;padding:15px 20px;border-radius:6px 6px 0 0">
            <h2 style="margin:0">LNMIIT Faculty Recruitment and Onboarding Portal</h2>
          </div>
          <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
            <p>Dear ${u.name || u.role},</p>
            <p><strong>${candidate?.fullName || "The candidate"}</strong> 
            (${record?.department || "—"}) has not joined as expected.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            <p>Please take necessary action if required.</p>
            <p>Regards,<br><strong>Establishment Section, LNMIIT</strong></p>
          </div>
        </div>`
      ).catch(console.error);
    }

    await log({
      user: req.user, action: "CANDIDATE_NOT_JOINED",
      entity: "OnboardingRecord", entityId: candidateId,
      description: `${candidate?.fullName} did not join. Reason: ${reason || "Not specified"}`, req,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("markNotJoined:", err);
    res.status(500).json({ message: "Failed" });
  }
};

/* ── Establishment logs — closed cycles only ── */
exports.getClosedCycleRecords = async (req, res) => {
  try {
    const { SelectedCandidate } = require("../models");
    const closedCycles = await RecruitmentCycle.findAll({
  attributes: ["cycle", "hodId"],
  where: { isClosed: true },
  order: [["createdAt", "DESC"]],
});
if (!closedCycles.length) return res.json([]);
const closedHodCycleSet = new Set(closedCycles.map(c => `${c.cycle}|${c.hodId}`));
const cycleStrings = [...new Set(closedCycles.map(c => c.cycle))];
const records = await OnboardingRecord.findAll({
  where: { cycle: cycleStrings },
  include: [
    { model: Candidate, as: "candidate" },
    { model: User, as: "hod", attributes: ["department", "name", "email"] },
  ],
});
    const selRecords = await SelectedCandidate.findAll({ where: { cycle: cycleStrings } });
    const selMap = {};
    selRecords.forEach(s => { selMap[s.candidateId] = s; });

    const deptMap = {};
    records.forEach(r => {
      // Skip records where this HOD's cycle is closed
      if (!closedHodCycleSet.has(`${r.cycle}|${r.hodId}`)) return;
      const dept = r.department || "General";
      if (!deptMap[dept]) deptMap[dept] = [];
      const sel = selMap[r.candidateId];
      deptMap[dept].push({
        ...r.toJSON(),
        selectionStatus:  sel?.status            || "NOT_SELECTED",
        waitlistPriority: sel?.waitlistPriority   || null,
        designation:      sel?.designation        || "",
        employmentType:   sel?.employmentType      || "",
        isCycleClosedFlag: true,
      });
    });

    res.json(Object.entries(deptMap).map(([department, records]) => ({ department, records })));
  } catch (err) {
    console.error("getClosedCycleRecords error:", err);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};