const { SelectedCandidate, OnboardingRecord, Candidate, User,RecruitmentCycle } = require("../models");
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
    if (req.user.role === "HOD") {
       const activeCycle = await getCurrentCycle(req.user.id);
        if (!activeCycle) return res.json([]);
        where.hodId = req.user.id;
        where.cycle = activeCycle.cycle;
    }else if(req.user.role === "DOFA" || req.user.role === "DOFA_OFFICE"){
      const { Op } = require("sequelize");
      const hods = await User.findAll({ where: { role: "HOD" }, attributes: ["id"] });
      const cyclePerHod = await Promise.all(
        hods.map(h => RecruitmentCycle.findOne({
          where: {
            hodId: h.id,
            status:"APPEARED_SUBMITTED",
            [Op.or]: [{ isClosed: false }, { isClosed: null }],
          },
          order: [["createdAt", "DESC"]],
        }))
      );

      const validCycles = cyclePerHod
        .filter(Boolean)
        .map(rc => rc.cycle);
      if (!validCycles.length) return res.json([]);
      where.cycle = { [Op.in]: validCycles };
    }
    if (req.query.cycle) {
      where.cycle = req.query.cycle;
    }

    const selected = await SelectedCandidate.findAll({
      where,
      include: [
        { model: Candidate, as: "candidate" },
        { model: User, as: "hod", attributes: ["department", "email", "name"] },
      ],
      order: [["createdAt", "DESC"]],
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

    // Track waitlist priority per department
    const waitlistCounts = {};

    for (const s of selections) {
      const status   = VALID_STATUSES.includes(s.status) ? s.status : "NOT_SELECTED";
      const hodCycle = await getCurrentCycle(s.hodId);

      // Compute waitlist priority
      let waitlistPriority = null;
      if (status === "WAITLISTED") {
        waitlistCounts[s.department] = (waitlistCounts[s.department] || 0) + 1;
        waitlistPriority = s.waitlistPriority || waitlistCounts[s.department];
      }

      await SelectedCandidate.upsert({
        candidateId:      s.candidateId,
        cycle:            hodCycle?.cycle || s.cycle,
        department:       s.department,
        hodId:            s.hodId,
        selectedById:     req.user.id,
        status,
        designation:      s.designation    || "",
        employmentType:   s.employmentType || "",
        waitlistPriority, // ← now correctly included
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
      const departments = [...new Set(selections.map(s => s.department).filter(Boolean))];
      const tmpl = templates.selectionPublishedToEstablishment({ selectedCount, waitlistedCount, department: departments.join(", ") });
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
    const { cycle,hodId } = req.body;
    if (!cycle) return res.status(400).json({ message: "cycle required" });
    const updateWhere = { cycle };
      if (hodId) updateWhere.hodId = hodId;
      await SelectedCandidate.update(
        { interviewComplete: true, interviewCompletedAt: new Date() },
        { where: updateWhere }
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
    const { Expert } = require("../models");
    const {
      fullName, designation, department, institute,
      email, phone, specialization,
      hodId,   // ← NEW: DOFA picks which HOD's active cycle
    } = req.body;
 
    if (!fullName || !email)
      return res.status(400).json({ message: "Full name and email are required" });
 
    let activeCycle;
    if (hodId) {
      // Use the specific HOD's active cycle
      activeCycle = await RecruitmentCycle.findOne({
        where: {
          hodId,
          [Op.or]: [{ isClosed: false }, { isClosed: null }, { isClosed: 0 }],
        },
        order: [["createdAt", "DESC"]],
      });
    } else {
      // Fallback: latest active cycle across all
      activeCycle = await RecruitmentCycle.findOne({
        where: {
          [Op.or]: [{ isClosed: false }, { isClosed: null }, { isClosed: 0 }],
        },
        order: [["createdAt", "DESC"]],
      });
    }
 
    if (!activeCycle) return res.status(404).json({ message: "No active cycle found" });
    const targetHod = await User.findByPk(hodId, { attributes: ["department"] });
    const expert = await Expert.create({
      fullName,
      designation:    designation    || "",
      department:     (department    || "GENERAL").toUpperCase(),
      institute:      institute      || "",
      email,
      phone:          phone          || null,
      specialization: specialization || null,
      cycle:          activeCycle.cycle,
      uploadedById:   req.user.id,
      uploadedByDept: targetHod?.department || null,
    });
 
    res.json({ success: true, expert });
  } catch (err) {
    console.error("addManualExpert error:", err);
    res.status(500).json({ message: err.message || "Failed to add expert" });
  }
};

exports.getAllCandidatesLogs = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const selected = await SelectedCandidate.findAll({
      include: [
        { model: Candidate, as: "candidate" },
        { model: User, as: "hod", attributes: ["department", "email", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const result = selected.map(s => ({
      id:              s.id,
      candidateId:     s.candidateId,
      fullName:        s.candidate?.fullName || "—",
      email:           s.candidate?.email   || "—",
      department:      s.department,
      designation:     s.designation        || "",
      employmentType:  s.employmentType     || "",
      selectionStatus: s.status,
      waitlistPriority:s.waitlistPriority   || null,
      cycle:           s.cycle,
      hod:             s.hod,
    }));

    res.json(result);
  } catch (err) {
    console.error("getAllCandidatesLogs:", err);
    res.status(500).json({ message: "Failed" });
  }
};