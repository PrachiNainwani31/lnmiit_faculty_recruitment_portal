const { SelectedCandidate, OnboardingRecord, Candidate, User } = require("../models");
const { sendEmail }          = require("../utils/emailSender");
const { createNotification } = require("../utils/notify");
const templates              = require("../utils/emailTemplates");
const { Op }                 = require("sequelize");
const getCurrentCycle           = require("../utils/getCurrentCycle");
const { log } = require("../utils/activityLogger");

const VALID_STATUSES = ["SELECTED", "WAITLISTED", "NOT_SELECTED", "REJECTED"];

exports.getSelectedCandidates = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === "HOD") where.hodId = req.user.id;

    const selected = await SelectedCandidate.findAll({
      where,
      include: [
        { model: Candidate, as: "candidate" },
        { model: User, as: "hod", attributes: ["department", "email", "name"] },
      ],
    });
    res.json(selected);
  } catch (err) {
    console.error("getSelectedCandidates error:", err);
    res.status(500).json({ message: "Failed to fetch" });
  }
};

/* ── Publish selection (#11) — email to Establishment only ── */
exports.publishSelection = async (req, res) => {
  try {
    const { selections } = req.body;
    if (!Array.isArray(selections) || selections.length === 0)
      return res.status(400).json({ message: "No selections provided" });

    for (const s of selections) {
      const status = VALID_STATUSES.includes(s.status) ? s.status : "NOT_SELECTED";
      const hodCycle = await getCurrentCycle(s.hodId);
      await SelectedCandidate.upsert({
        candidateId:    s.candidateId,
        cycle:          hodCycle?.cycle || s.cycle,
        department:     s.department,
        hodId:          s.hodId,
        selectedById:   req.user.id,
        status,
        designation:    s.designation    || "",
        employmentType: s.employmentType || "",
      });

      if (status === "SELECTED" || status === "WAITLISTED") {
        await OnboardingRecord.upsert({
          candidateId: s.candidateId,
          cycle:       hodCycle?.cycle || s.cycle,
          department:  s.department,
          hodId:       s.hodId,
        });
      }
    }

    const selectedCount   = selections.filter(s => s.status === "SELECTED").length;
    const waitlistedCount = selections.filter(s => s.status === "WAITLISTED").length;

    if (selectedCount > 0 || waitlistedCount > 0) {
      // Email #11 — Establishment only
      const estUsers = await User.findAll({ where: { role: "ESTABLISHMENT" } });
      const tmpl = templates.selectionPublishedToEstablishment({ selectedCount, waitlistedCount });
      for (const u of estUsers) {
        await sendEmail(u.email, tmpl.subject, tmpl.html).catch(console.error);
      }
      await createNotification({
        cycle: selections[0] ? (await getCurrentCycle(selections[0].hodId))?.cycle || "SYSTEM" : "SYSTEM", role: "ESTABLISHMENT",
        title:   "Selection Published",
        message: `${selectedCount} selected, ${waitlistedCount} waitlisted. Please issue offer letters.`,
        type:    "STATUS",
      });
    } else {
      await createNotification({
        cycle: selections[0]?.cycle || "SYSTEM", role: "ESTABLISHMENT",
        title:   "No Candidates Selected",
        message: "DOFA Office completed selection — no candidates were selected.",
        type:    "STATUS",
      });
    }

    await log({
      user:        req.user,
      action:      "SELECTION_PUBLISHED",
      entity:      "SelectedCandidate",
      entityId:    null,
      description: `Selection published: ${selectedCount} selected, ${waitlistedCount} waitlisted`,
      req,
    });

    res.json({ success: true, selectedCount, waitlistedCount });
  } catch (err) {
    console.error("publishSelection error:", err);
    res.status(500).json({ message: "Failed to publish selection" });
  }
};

/* ── Mark interview complete — no email, just DB update ── */
exports.markInterviewComplete = async (req, res) => {
  try {
    const { cycle } = req.body;
    if (!cycle) return res.status(400).json({ message: "cycle required" });
    await SelectedCandidate.update(
      { interviewComplete: true, interviewCompletedAt: new Date() },
      { where: { cycle: cycle } }
    );

    const selectedCount = await SelectedCandidate.count({
      where: { cycle: cycle, status: "SELECTED" },
    });

    const notifyRoles = ["HOD", "DOFA", "LUCS", "ESTABLISHMENT"];
    const message = selectedCount > 0
      ? `Interview process complete. ${selectedCount} candidate(s) selected.`
      : `Interview process complete. No candidates were selected in this cycle.`;

    for (const role of notifyRoles) {
      await createNotification({
        cycle,
        role,
        title:   "Interview Process Complete",
        message,
        type:    "STATUS",
      });
    }

    if (selectedCount === 0) {
      const { User } = require("../models");
      const { sendEmail } = require("../utils/emailSender");
      const estUsers = await User.findAll({ where: { role: "ESTABLISHMENT" } });
      for (const u of estUsers) {
        await sendEmail(
          u.email,
          "Recruitment Cycle Complete — No Candidates Selected",
          `<p>Dear ${u.name || "Team"},</p>
           <p>The interview process for cycle <strong>${cycle}</strong> is complete. 
           No candidates were selected in this cycle. No further action is required.</p>
           <p>Regards,<br>DOFA Office, LNMIIT</p>`
        ).catch(console.error);
      }
    }

    await log({
      user:        req.user,
      action:      "INTERVIEW_COMPLETED_MARKED",
      entity:      "SelectedCandidate",
      entityId:    null,
      description: `Interview marked completed. Selected:${selectedCount}`,req,
    });
    res.json({ success: true, selectedCount });
  } catch (err) {
    console.error("markInterviewComplete error:", err);
    res.status(500).json({ message: "Failed to mark complete" });
  }
};

exports.addManualExpert = async (req, res) => {
  try {
    const { fullName, designation, department, institute, email, phone, specialization } = req.body;
    if (!fullName || !email)
      return res.status(400).json({ message: "Full name and email are required" });

    const dept = (department || "").toUpperCase().trim();
    let uploadedById = req.user.id;
    if (dept) {
      const hod = await User.findOne({ where: { role: "HOD", department: dept } });
      if (hod) uploadedById = hod.id;
    }

    const { Expert } = require("../models");
    const hod = await User.findOne({ where: { role: "HOD", department: dept } });
    const hodCycle = hod ? await getCurrentCycle(hod.id) : null;
    const expert = await Expert.create({
      fullName, designation: designation || null, department: dept || null,
      institute: institute || null, email, phone: phone || null,
      specialization: specialization || null, cycle: hodCycle?.cycle || "UNKNOWN", uploadedById,
    });
    res.json({ success: true, expert });
  } catch (err) {
    console.error("addManualExpert error:", err);
    res.status(500).json({ message: "Failed to add expert" });
  }
};