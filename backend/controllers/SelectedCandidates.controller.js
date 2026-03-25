const SelectedCandidate = require("../models/SelectedCandidate");
const OnboardingRecord  = require("../models/OnboardingRecord");
const Candidate         = require("../models/Candidate");
const User              = require("../models/User");
const { sendEmail }     = require("../utils/emailSender");
const CYCLE             = require("../config/activeCycle");

/* ── Get all selected candidates (DOFA/HOD/Establishment) ── */
exports.getSelectedCandidates = async (req, res) => {
  try {
    const filter = { cycle: CYCLE };
    if (req.user.role === "HOD") filter.hodId = req.user._id;

    const selected = await SelectedCandidate.find(filter)
      .populate("candidate")
      .populate("hodId", "department email name");

    res.json(selected);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch" });
  }
};

/* ── Publish selection (DOFA Office) ── */
exports.publishSelection = async (req, res) => {
  try {
    const { selections } = req.body;
    // selections: [{ candidateId, status, hodId, department }]

    for (const s of selections) {
      await SelectedCandidate.findOneAndUpdate(
        { candidate: s.candidateId, cycle: CYCLE },
        {
          candidate:  s.candidateId,
          cycle:      CYCLE,
          department: s.department,
          hodId:      s.hodId,
          selectedBy: req.user._id,
          status:     s.status || "SELECTED",
        },
        { upsert: true, new: true }
      );

      // Create onboarding record for selected candidates
      if (s.status === "SELECTED") {
        await OnboardingRecord.findOneAndUpdate(
          { candidate: s.candidateId, cycle: CYCLE },
          { candidate: s.candidateId, cycle: CYCLE, department: s.department, hodId: s.hodId },
          { upsert: true, new: true }
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("publishSelection error:", err);
    res.status(500).json({ message: "Failed to publish selection" });
  }
};

/* ── Mark interview complete ── */
exports.markInterviewComplete = async (req, res) => {
  try {
    const { cycle } = req.body;
    await SelectedCandidate.updateMany(
      { cycle: cycle || CYCLE },
      { interviewComplete: true, interviewCompletedAt: new Date() }
    );

    // Notify DOFA and HODs
    const roles = await User.find({ role: { $in: ["DOFA", "HOD"] } });
    for (const u of roles) {
      await sendEmail(
        u.email,
        `Interview Complete — ${CYCLE}`,
        `<p>The interview process for recruitment cycle ${CYCLE} has been marked complete by DOFA Office.</p>`
      ).catch(console.error);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark complete" });
  }
};

/* ── Add expert manually (DOFA Office) ── */
exports.addManualExpert = async (req, res) => {
  try {
    const Expert = require("../models/Expert");
    const { fullName, designation, department, institute, email, phone } = req.body;

    if (!fullName || !email)
      return res.status(400).json({ message: "Full name and email are required" });

    const expert = await Expert.create({
      fullName, designation, department, institute, email, phone,
      cycle:      CYCLE,
      uploadedBy: req.user._id,
    });

    res.json({ success: true, expert });
  } catch (err) {
    console.error("addManualExpert error:", err);
    res.status(500).json({ message: "Failed to add expert" });
  }
};