const OnboardingRecord = require("../models/OnboardingRecord");
const { sendEmail }    = require("../utils/emailSender");
const CYCLE            = require("../config/activeCycle");

/* ════════════════════════════
   ESTATE CONTROLLER
════════════════════════════ */
exports.getPendingHandovers = async (req, res) => {
  try {
    const records = await OnboardingRecord.find({
      cycle: CYCLE,
      roomNumber: { $exists: true, $ne: "" },
    }).populate("candidate");
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch" });
  }
};

exports.confirmHandover = async (req, res) => {
  try {
    const { candidateId, handoverDate, handoverNotes } = req.body;

    const record = await OnboardingRecord.findOneAndUpdate(
      { candidate: candidateId, cycle: CYCLE },
      {
        roomHandedOver:    true,
        roomHandoverDate:  new Date(handoverDate),
        roomHandoverNotes: handoverNotes,
      },
      { new: true }
    ).populate("candidate");

    // Notify DOFA Office
    await sendEmail(
      process.env.DOFA_OFFICE_EMAIL || "dofaoffice@lnmiit.ac.in",
      `Room Handover Confirmed: ${record?.candidate?.fullName}`,
      `<p>Room ${record?.roomNumber} in ${record?.roomBuilding} has been handed over to ${record?.candidate?.fullName} on ${new Date(handoverDate).toLocaleDateString("en-GB")}.</p>`
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
    const records = await OnboardingRecord.find({
      cycle: CYCLE,
      roomHandedOver: true,
    }).populate("candidate");
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch" });
  }
};

exports.updateLucs = async (req, res) => {
  try {
    const { candidateId, emailAssigned, emailId, itAssetsIssued, wifiProvided, portalLoginDone } = req.body;

    const allDone = emailAssigned && itAssetsIssued && wifiProvided && portalLoginDone;

    const record = await OnboardingRecord.findOneAndUpdate(
      { candidate: candidateId, cycle: CYCLE },
      {
        "lucs.emailAssigned":   emailAssigned,
        "lucs.emailId":         emailId,
        "lucs.itAssetsIssued":  itAssetsIssued,
        "lucs.wifiProvided":    wifiProvided,
        "lucs.portalLoginDone": portalLoginDone,
        ...(allDone ? {
          "lucs.confirmedAt": new Date(),
          "lucs.confirmedBy": req.user._id,
        } : {}),
      },
      { new: true }
    ).populate("candidate");

    // Notify establishment when all done
    if (allDone) {
      await sendEmail(
        process.env.ESTABLISHMENT_EMAIL || "establishment@lnmiit.ac.in",
        `IT Assets Assigned: ${record?.candidate?.fullName}`,
        `<p>LUCS has completed IT asset assignment for ${record?.candidate?.fullName}. Institute email: ${emailId}.</p>`
      ).catch(console.error);
    }

    res.json({ success: true, record });
  } catch (err) {
    console.error("updateLucs error:", err);
    res.status(500).json({ message: "Failed to update" });
  }
};