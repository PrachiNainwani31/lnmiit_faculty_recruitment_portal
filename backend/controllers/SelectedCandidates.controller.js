// controllers/SelectedCandidates.controller.js
const { SelectedCandidate, OnboardingRecord, Candidate, User, Expert } = require("../models");
const { sendEmail } = require("../utils/emailSender");
const { createNotification } = require("../utils/notify");
const { Op } = require("sequelize");
const CYCLE = require("../config/activeCycle");

/* ── Get all selected candidates ── */
exports.getSelectedCandidates = async (req, res) => {
  try {
    const where = { cycle: CYCLE };
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

/* ── Publish selection ── */
exports.publishSelection = async (req, res) => {
  try {
    const { selections } = req.body;

    if (!Array.isArray(selections) || selections.length === 0)
      return res.status(400).json({ message: "No selections provided" });

    for (const s of selections) {
      // ✅ FIX 1: "selectedBy" → "selectedById" (matches model column name)
      // ✅ FIX 2: designation + employmentType now exist in the model
      // ✅ FIX 3: status uses "NOT_SELECTED" which is now in the ENUM
      await SelectedCandidate.upsert({
        candidateId:  s.candidateId,
        cycle:        CYCLE,
        department:   s.department,
        hodId:        s.hodId,
        selectedById: req.user.id,
        status:       s.status === "SELECTED" ? "SELECTED" : "NOT_SELECTED",
        designation:  s.designation    || "",
        employmentType: s.employmentType || "",
      });

      // Only create onboarding record for actually selected candidates
      if (s.status === "SELECTED") {
        await OnboardingRecord.upsert({
          candidateId: s.candidateId,
          cycle:       CYCLE,
          department:  s.department,
          hodId:       s.hodId,
        });
      }
    }

    const selectedCount = selections.filter(s => s.status === "SELECTED").length;

    if (selectedCount === 0) {
      for (const role of ["DOFA", "HOD", "ESTABLISHMENT", "LUCS", "TRAVEL"]) {
        await createNotification({
          cycle:   CYCLE,
          role,
          title:   "No Candidates Selected",
          message: "DOFA Office completed selection — no candidates were selected.",
          type:    "STATUS",
        });
      }
    } else {
      for (const role of ["HOD", "ESTABLISHMENT", "LUCS"]) {
        await createNotification({
          cycle:   CYCLE,
          role,
          title:   "Selection Published",
          message: `DOFA Office published selection: ${selectedCount} candidate(s) selected.`,
          type:    "STATUS",
        });
      }
    }

    res.json({ success: true, selectedCount });
  } catch (err) {
    console.error("publishSelection error:", err);
    res.status(500).json({ message: "Failed to publish selection" });
  }
};

/* ── Mark interview complete ── */
exports.markInterviewComplete = async (req, res) => {
  try {
    const { cycle } = req.body;

    await SelectedCandidate.update(
      { interviewComplete: true, interviewCompletedAt: new Date() },
      { where: { cycle: cycle || CYCLE } }
    );

    const selectedCount = await SelectedCandidate.count({
      where: { cycle: cycle || CYCLE, status: "SELECTED" },
    });

    const users = await User.findAll({
      where: { role: { [Op.in]: ["DOFA", "HOD"] } },
    });
    for (const u of users) {
      await sendEmail(
        u.email,
        `Interview Complete — ${CYCLE}`,
        `<p>Interview process completed for ${CYCLE}</p>`
      ).catch(console.error);
    }

    res.json({ success: true, selectedCount });
  } catch (err) {
    console.error("markInterviewComplete error:", err);
    res.status(500).json({ message: "Failed to mark complete" });
  }
};

/* ── Add expert manually ── */
exports.addManualExpert = async (req, res) => {
  try {
    const {
      fullName, designation, department,
      institute, email, phone, specialization,
    } = req.body;

    if (!fullName || !email)
      return res.status(400).json({ message: "Full name and email are required" });

    const dept = (department || "").toUpperCase().trim();

    let uploadedById = req.user.id;
    if (dept) {
      const hod = await User.findOne({ where: { role: "HOD", department: dept } });
      if (hod) uploadedById = hod.id;
    }

    const { Expert } = require("../models");
    const expert = await Expert.create({
      fullName,
      designation:    designation    || null,
      department:     dept           || null,
      institute:      institute      || null,
      email,
      phone:          phone          || null,
      specialization: specialization || null,
      cycle:          CYCLE,
      uploadedById,
    });

    res.json({ success: true, expert });
  } catch (err) {
    console.error("addManualExpert error:", err);
    res.status(500).json({ message: "Failed to add expert" });
  }
};