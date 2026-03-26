const { SelectedCandidate, OnboardingRecord, Candidate, User, Expert } = require("../models");
const { sendEmail } = require("../utils/emailSender");
const { Op } = require("sequelize");
const CYCLE = require("../config/activeCycle");

/* ── Get all selected candidates ── */
exports.getSelectedCandidates = async (req, res) => {
  try {
    const where = { cycle: CYCLE };

    if (req.user.role === "HOD") {
      where.hodId = req.user.id;
    }

    const selected = await SelectedCandidate.findAll({
      where,
      include: [
        { model: Candidate, as: "candidate" },
        {
          model: User,
          as: "hod",
          attributes: ["department", "email", "name"]
        }
      ]
    });

    res.json(selected);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch" });
  }
};

/* ── Publish selection ── */
exports.publishSelection = async (req, res) => {
  try {
    const { selections } = req.body;

    for (const s of selections) {

      // ❌ findOneAndUpdate → ✅ upsert
      await SelectedCandidate.upsert({
        candidateId: s.candidateId,
        cycle: CYCLE,
        department: s.department,
        hodId: s.hodId,
        selectedBy: req.user.id,
        status: s.status || "SELECTED"
      });

      // Create onboarding record
      if (s.status === "SELECTED") {
        await OnboardingRecord.upsert({
          candidateId: s.candidateId,
          cycle: CYCLE,
          department: s.department,
          hodId: s.hodId
        });
      }
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: "Failed to publish selection" });
  }
};

/* ── Mark interview complete ── */
exports.markInterviewComplete = async (req, res) => {
  try {
    const { cycle } = req.body;

    await SelectedCandidate.update(
      {
        interviewComplete: true,
        interviewCompletedAt: new Date()
      },
      {
        where: { cycle: cycle || CYCLE }
      }
    );

    // Notify DOFA + HOD
    const users = await User.findAll({
      where: {
        role: { [Op.in]: ["DOFA", "HOD"] }
      }
    });

    for (const u of users) {
      await sendEmail(
        u.email,
        `Interview Complete — ${CYCLE}`,
        `<p>Interview process completed for ${CYCLE}</p>`
      ).catch(console.error);
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: "Failed to mark complete" });
  }
};

/* ── Add expert manually ── */
exports.addManualExpert = async (req, res) => {
  try {
    const {
      fullName,
      designation,
      department,
      institute,
      email,
      phone
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        message: "Full name and email are required"
      });
    }

    const expert = await Expert.create({
      fullName,
      designation,
      department,
      institute,
      email,
      phone,
      cycle: CYCLE,
      uploadedById: req.user.id
    });

    res.json({ success: true, expert });

  } catch (err) {
    res.status(500).json({ message: "Failed to add expert" });
  }
};