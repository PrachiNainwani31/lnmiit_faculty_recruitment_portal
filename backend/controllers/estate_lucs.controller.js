// controllers/estate_lucs.controller.js
const { OnboardingRecord, Candidate } = require("../models");
const { sendEmail } = require("../utils/emailSender");
const { Op } = require("sequelize");
const CYCLE = require("../config/activeCycle");

/* ════════════════════════════
   ESTATE
════════════════════════════ */
exports.getPendingHandovers = async (req, res) => {
  try {
    const records = await OnboardingRecord.findAll({
      where: {
        cycle:      CYCLE,
        roomNumber: { [Op.ne]: null },
      },
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

    await OnboardingRecord.update(
      {
        roomHandedOver:    true,
        roomHandoverDate:  new Date(handoverDate),
        roomHandoverNotes: handoverNotes,
      },
      { where: { candidateId, cycle: CYCLE } }
    );

    const record = await OnboardingRecord.findOne({
      where:   { candidateId, cycle: CYCLE },
      include: [{ model: Candidate, as: "candidate" }],
    });

    await sendEmail(
      process.env.DOFA_OFFICE_EMAIL || "dofaoffice@lnmiit.ac.in",
      `Room Handover Confirmed: ${record?.candidate?.fullName}`,
      `<p>Room ${record?.roomNumber} in ${record?.roomBuilding} handed over to ${record?.candidate?.fullName}</p>`
    ).catch(console.error);

    res.json({ success: true, record });

  } catch (err) {
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
    const records = await OnboardingRecord.findAll({
      where: {
        cycle:             CYCLE,
        joiningLetterPath: { [Op.ne]: null },  // ← GATE: joining letter must exist
      },
      include: [{ model: Candidate, as: "candidate" }],
    });

    res.json(records);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch" });
  }
};

exports.updateLucs = async (req, res) => {
  try {
    const {
      candidateId,
      // Checkboxes
      emailAssigned,
      emailId,
      itAssetsIssued,
      itAssetsNote,       // NEW text
      wifiProvided,
      websiteLogin,       // renamed from portalLoginDone
      websiteLoginNote,   // NEW text
      otherDone,          // NEW
      otherNote,          // NEW text
    } = req.body;

    // Security gate: joining letter must exist
    const record = await OnboardingRecord.findOne({
      where: { candidateId, cycle: CYCLE },
    });

    if (!record)
      return res.status(404).json({ message: "Record not found" });

    if (!record.joiningLetterPath)
      return res.status(403).json({
        message: "Cannot update LUCS details before establishment uploads joining letter",
        gated: true,
      });

    const allDone =
      emailAssigned && itAssetsIssued && wifiProvided && websiteLogin;

    await OnboardingRecord.update(
      {
        lucsEmailAssigned:    emailAssigned,
        lucsEmailId:          emailId            || null,
        lucsItAssetsIssued:   itAssetsIssued,
        lucsItAssetsNote:     itAssetsNote        || null,
        lucsWifiProvided:     wifiProvided,
        lucsWebsiteLogin:     websiteLogin,
        lucsWebsiteLoginNote: websiteLoginNote    || null,
        lucsOtherDone:        otherDone           || false,
        lucsOtherNote:        otherNote           || null,
        ...(allDone && {
          lucsConfirmedAt:    new Date(),
          lucsConfirmedById:  req.user.id,
          onboardingComplete: true,
          onboardingCompletedAt: new Date(),
        }),
      },
      { where: { candidateId, cycle: CYCLE } }
    );

    const updated = await OnboardingRecord.findOne({
      where:   { candidateId, cycle: CYCLE },
      include: [{ model: Candidate, as: "candidate" }],
    });

    if (allDone) {
      await sendEmail(
        process.env.ESTABLISHMENT_EMAIL || "establishment@lnmiit.ac.in",
        `IT Assets Assigned: ${updated?.candidate?.fullName}`,
        `<p>LUCS completed IT setup for ${updated?.candidate?.fullName}</p>`
      ).catch(console.error);
    }

    res.json({ success: true, record: updated });

  } catch (err) {
    console.error("updateLucs error:", err);
    res.status(500).json({ message: "Failed to update" });
  }
};