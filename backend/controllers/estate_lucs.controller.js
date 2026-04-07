// controllers/estate_lucs.controller.js
const { RecruitmentCycle,OnboardingRecord, Candidate } = require("../models");
const { sendEmail } = require("../utils/emailSender");
const { Op } = require("sequelize");
const getCurrentCycle = require("../utils/getCurrentCycle");

/* ════════════════════════════
   ESTATE
════════════════════════════ */
async function getActiveCycleStrings() {
  const cycles = await RecruitmentCycle.findAll({ attributes: ["cycle"] });
  return cycles.map(c => c.cycle);
}

exports.getPendingHandovers = async (req, res) => {
  try {
    const cycleStrings = await getActiveCycleStrings();
    const records = await OnboardingRecord.findAll({
      where: { cycle: cycleStrings, roomNumber: { [Op.ne]: null } },
      include: [{ model: Candidate, as: "candidate" }],
    });
    res.json(records);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch" });
  }
};

exports.confirmHandover = async (req, res) => {
  try {
    const { candidateId, handoverDate, handoverNotes } = req.body;

    const record = await OnboardingRecord.findOne({
      where: { candidateId },
      include: [{ model: Candidate, as: "candidate" }],
    });
    if (!record) return res.status(404).json({ message: "Record not found" });

    await OnboardingRecord.update(
      {
        roomHandedOver:    true,
        roomHandoverDate:  new Date(handoverDate),
        roomHandoverNotes: handoverNotes || null,
      },
      { where: { candidateId, cycle: record.cycle } }
    );

    await sendEmail(
      process.env.DOFA_OFFICE_EMAIL,
      `Room Handover Confirmed: ${record.candidate?.fullName}`,
      `<p>Room ${record.roomNumber} handed over to ${record.candidate?.fullName}</p>`
    ).catch(console.error);

    res.json({ success: true });
  } catch (err) {
    console.error("confirmHandover error:", err);
    res.status(500).json({ message: "Failed to confirm handover" });
  }
};

/* ════════════════════════════
   LUCS
   Gated behind joining letter upload.
   Establishment must upload joining
   letter before LUCS can fill anything.
════════════════════════════ */
exports.getLucsRecords = async (req, res) => {
  try {
    // Gate: only show records where joining letter has been uploaded
    const cycleStrings = await getActiveCycleStrings();
    const records = await OnboardingRecord.findAll({
      where: { cycle: cycleStrings, joiningLetterPath: { [Op.ne]: null } },
      include: [{ model: Candidate, as: "candidate" }],
    });

    res.json(records);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch" });
  }
};

exports.updateLucs = async (req, res) => {
  try {
    const { candidateId, emailAssigned, emailId, itAssetsIssued, itAssetsNote,
            wifiProvided, websiteLogin, websiteLoginNote, otherDone, otherNote } = req.body;

    // ✅ find record first with no cycle constraint
    const record = await OnboardingRecord.findOne({
      where: { candidateId },
      include: [{ model: Candidate, as: "candidate" }],
    });

    if (!record) return res.status(404).json({ message: "Record not found" });

    if (!record.joiningLetterPath)
      return res.status(403).json({
        message: "Cannot update LUCS details before establishment uploads joining letter",
        gated: true,
      });

    const allDone = emailAssigned && itAssetsIssued && wifiProvided && websiteLogin;

    await OnboardingRecord.update(
      {
        lucsEmailAssigned:    emailAssigned,
        lucsEmailId:          emailId         || null,
        lucsItAssetsIssued:   itAssetsIssued,
        lucsItAssetsNote:     itAssetsNote     || null,
        lucsWifiProvided:     wifiProvided,
        lucsWebsiteLogin:     websiteLogin,
        lucsWebsiteLoginNote: websiteLoginNote || null,
        lucsOtherDone:        otherDone        || false,
        lucsOtherNote:        otherNote        || null,
        ...(allDone && {
          lucsConfirmedAt:       new Date(),
          lucsConfirmedById:     req.user.id,
          onboardingComplete:    true,
          onboardingCompletedAt: new Date(),
        }),
      },
      { where: { candidateId, cycle: record.cycle } }  // ✅ use record.cycle
    );

    if (allDone) {
      await sendEmail(
        process.env.ESTABLISHMENT_EMAIL || "establishment@lnmiit.ac.in",
        `IT Assets Assigned: ${record.candidate?.fullName}`,
        `<p>LUCS completed IT setup for ${record.candidate?.fullName}</p>`
      ).catch(console.error);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("updateLucs error:", err);
    res.status(500).json({ message: "Failed to update" });
  }
};