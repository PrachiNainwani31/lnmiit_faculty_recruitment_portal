const { OnboardingRecord, Candidate } = require("../models");
const { sendEmail } = require("../utils/emailSender");
const CYCLE = require("../config/activeCycle");

/* ════════════════════════════
   ESTATE CONTROLLER
════════════════════════════ */
exports.getPendingHandovers = async (req, res) => {
  try {
    const records = await OnboardingRecord.findAll({
      where: {
        cycle: CYCLE,
        roomNumber: { [require("sequelize").Op.ne]: "" },
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
        roomHandedOver: true,
        roomHandoverDate: new Date(handoverDate),
        roomHandoverNotes: handoverNotes,
      },
      {
        where: { candidateId, cycle: CYCLE },
      }
    );

    const record = await OnboardingRecord.findOne({
      where: { candidateId, cycle: CYCLE },
      include: [{ model: Candidate, as: "candidate" }],
    });

    // Notify DOFA Office
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
   LUCS CONTROLLER
════════════════════════════ */
exports.getLucsRecords = async (req, res) => {
  try {
    const records = await OnboardingRecord.findAll({
      where: {
        cycle: CYCLE,
        roomHandedOver: true,
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
      emailAssigned,
      emailId,
      itAssetsIssued,
      wifiProvided,
      portalLoginDone
    } = req.body;

    const allDone =
      emailAssigned &&
      itAssetsIssued &&
      wifiProvided &&
      portalLoginDone;

    // 👇 JSON field handling
    const record = await OnboardingRecord.findOne({
      where: { candidateId, cycle: CYCLE }
    });

    if (!record)
      return res.status(404).json({ message: "Record not found" });

    const lucs = record.lucs || {};

    lucs.emailAssigned = emailAssigned;
    lucs.emailId = emailId;
    lucs.itAssetsIssued = itAssetsIssued;
    lucs.wifiProvided = wifiProvided;
    lucs.portalLoginDone = portalLoginDone;

    if (allDone) {
      lucs.confirmedAt = new Date();
      lucs.confirmedBy = req.user.id;
    }

    await OnboardingRecord.update(
      { lucs },
      { where: { candidateId, cycle: CYCLE } }
    );

    const updated = await OnboardingRecord.findOne({
      where: { candidateId, cycle: CYCLE },
      include: [{ model: Candidate, as: "candidate" }]
    });

    // Notify establishment
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