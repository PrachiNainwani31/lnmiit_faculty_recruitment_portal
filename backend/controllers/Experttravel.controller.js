// controllers/Experttravel.controller.js
const { ExpertTravel, Expert, User } = require("../models");
const { sendEmail } = require("../utils/emailSender");
const { Op } = require("sequelize");
const CYCLE = require("../config/activeCycle");

const RAMSWAROOP_EMAIL = process.env.RAMSWAROOP_EMAIL || "ramsharma@lnmiit.ac.in";

/* ─────────────────────────────────────────
   Helper: get or create travel record
───────────────────────────────────────── */
async function getOrCreate(expertId) {
  let doc = await ExpertTravel.findOne({ where: { expertId, cycle: CYCLE } });
  if (!doc) doc = await ExpertTravel.create({ expertId, cycle: CYCLE });
  return doc;
}

/* ─────────────────────────────────────────
   Helper: reconstruct nested objects from flat columns
   so frontend components that expect { traveller:{}, quote:{}, pickupDrop:{} }
   continue to work without changes.
───────────────────────────────────────── */
function toNestedShape(t) {
  if (!t) return null;
  const raw = t.toJSON ? t.toJSON() : { ...t };

  return {
    ...raw,
    // Reconstruct traveller
    traveller: {
      name:              raw.travellerName,
      gender:            raw.travellerGender,
      age:               raw.travellerAge,
      mealPreference:    raw.travellerMealPreference,
      preferredSeat:     raw.travellerPreferredSeat,
      journeyType:       raw.travellerJourneyType || "Direct",
      onwardFrom:        raw.travellerOnwardFrom,
      onwardTime:        raw.travellerOnwardTime,
      onwardFromCity:    raw.travellerOnwardFromCity,
      onwardToCity:      raw.travellerOnwardToCity,
      onwardFlightNo:    raw.travellerOnwardFlightNo,
      returnFrom:        raw.travellerReturnFrom,
      returnTime:        raw.travellerReturnTime,
      returnFromCity:    raw.travellerReturnFromCity,
      returnToCity:      raw.travellerReturnToCity,
      returnFlightNo:    raw.travellerReturnFlightNo,
      connections:       raw.travellerConnections       || [],
      returnConnections: raw.travellerReturnConnections || [],
    },
    // Reconstruct quote (null if no quote submitted yet)
    quote: raw.quoteAmount != null || raw.quoteStatus ? {
      amount:        raw.quoteAmount,
      vendor:        raw.quoteVendor,
      remarks:       raw.quoteRemarks,
      status:        raw.quoteStatus || "PENDING",
      submittedAt:   raw.quoteSubmittedAt,
      approvedAt:    raw.quoteApprovedAt,
      approvedBy:    raw.quoteApprovedBy,
      rejectionNote: raw.quoteRejectionNote,
    } : null,
    // Reconstruct pickupDrop
    pickupDrop: {
      pickupLocation: raw.pickupLocation,
      pickupTime:     raw.pickupTime,
      dropLocation:   raw.dropLocation,
      dropTime:       raw.dropTime,
      enteredByDofa:  raw.enteredByDofa,
      driverName:     raw.driverName,
      driverContact:  raw.driverContact,
    },
  };
}

/* ─────────────────────────────────────────
   GET ALL EXPERT TRAVEL
   Returns nested shape for frontend compatibility
───────────────────────────────────────── */
exports.getAllExpertTravel = async (req, res) => {
  try {
    const experts = await Expert.findAll({
      include: [{ model: User, as: "uploadedBy", attributes: ["name", "department", "role"] }],
    });

    const travels = await ExpertTravel.findAll({ where: { cycle: CYCLE } });

    const travelMap = {};
    travels.forEach(t => { travelMap[t.expertId] = t; });

    const result = experts.map(e => ({
      expert: e,
      travel: toNestedShape(travelMap[e.id]) || null,
    }));

    res.json(result);
  } catch (err) {
    console.error("getAllExpertTravel error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   SAVE CONFIRMATION
   Accepts nested { traveller: {...} } from frontend,
   saves to flat columns.
───────────────────────────────────────── */
exports.saveConfirmation = async (req, res) => {
  try {
    const { expertId } = req.params;
    const data = req.body;
    const tr   = data.traveller || {};

    await getOrCreate(expertId);

    await ExpertTravel.update(
      {
        confirmed:      data.confirmed,
        contactNumber:  data.contactNumber,
        presenceStatus: data.presenceStatus,
        onlineLink:     data.onlineLink || null,
        modeOfTravel:   data.modeOfTravel || null,

        // Flat traveller columns
        travellerName:           tr.name            || null,
        travellerGender:         tr.gender           || null,
        travellerAge:            tr.age ? Number(tr.age) : null,
        travellerMealPreference: tr.mealPreference   || null,
        travellerPreferredSeat:  tr.preferredSeat    || null,
        travellerJourneyType:    tr.journeyType      || "Direct",
        // Onward
        travellerOnwardFrom:     tr.onwardFrom ? new Date(tr.onwardFrom) : null,
        travellerOnwardTime:     tr.onwardTime       || null,
        travellerOnwardFromCity: tr.onwardFromCity   || null,
        travellerOnwardToCity:   tr.onwardToCity     || null,
        travellerOnwardFlightNo: tr.onwardFlightNo   || null,
        // Return
        travellerReturnFrom:     tr.returnFrom ? new Date(tr.returnFrom) : null,
        travellerReturnTime:     tr.returnTime       || null,
        travellerReturnFromCity: tr.returnFromCity   || null,
        travellerReturnToCity:   tr.returnToCity     || null,
        travellerReturnFlightNo: tr.returnFlightNo   || null,
        // Connecting legs
        travellerConnections:       tr.connections       || [],
        travellerReturnConnections: tr.returnConnections || [],
      },
      { where: { expertId, cycle: CYCLE } }
    );

    const doc    = await getOrCreate(expertId);
    const expert = await Expert.findByPk(expertId);

    if (data.presenceStatus === "Offline" && data.confirmed) {
      await sendEmail(
        RAMSWAROOP_EMAIL,
        `Travel Required: ${expert.fullName}`,
        `<p>Please arrange travel for <strong>${expert.fullName}</strong>.</p>
         <p>Contact: ${data.contactNumber || "—"}</p>
         ${tr.age ? `<p>Age: ${tr.age}</p>` : ""}
         <p>Mode: ${data.modeOfTravel || "—"}</p>
         ${tr.onwardFrom ? `<p>Arrival: ${new Date(tr.onwardFrom).toLocaleDateString("en-GB")} ${tr.onwardTime || ""}</p>` : ""}
         ${tr.onwardFlightNo ? `<p>Flight/Train: ${tr.onwardFlightNo}</p>` : ""}`
      ).catch(console.error);
    }

    res.json({ success: true, doc: toNestedShape(doc) });
  } catch (err) {
    console.error("saveConfirmation error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   SUBMIT QUOTE
───────────────────────────────────────── */
exports.submitQuote = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { amount, vendor, remarks } = req.body;

    await getOrCreate(expertId);

    await ExpertTravel.update(
      {
        quoteAmount:      Number(amount),
        quoteVendor:      vendor   || null,
        quoteRemarks:     remarks  || null,
        quoteStatus:      "PENDING",
        quoteSubmittedAt: new Date(),
        // Reset approval fields on resubmit
        quoteApprovedAt:    null,
        quoteApprovedBy:    null,
        quoteRejectionNote: null,
      },
      { where: { expertId, cycle: CYCLE } }
    );

    const expert    = await Expert.findByPk(expertId);
    const dofaUsers = await User.findAll({
      where: { role: { [Op.in]: ["DOFA", "ADOFA"] } },
    });

    const emails = dofaUsers.map(u => u.email).join(",");
    if (emails) {
      await sendEmail(
        emails,
        `Quote Submitted: ${expert.fullName}`,
        `<p>Quote submitted for <strong>${expert.fullName}</strong> — ₹${amount}</p>
         <p>Vendor: ${vendor || "—"}</p>
         ${remarks ? `<p>Remarks: ${remarks}</p>` : ""}`
      ).catch(console.error);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("submitQuote error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   APPROVE QUOTE
───────────────────────────────────────── */
exports.approveQuote = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { status, rejectionNote } = req.body;

    await ExpertTravel.update(
      {
        quoteStatus:        status,
        quoteApprovedAt:    new Date(),
        quoteApprovedBy:    req.user.role,
        quoteRejectionNote: rejectionNote || null,
      },
      { where: { expertId, cycle: CYCLE } }
    );

    const expert = await Expert.findByPk(expertId);
    await sendEmail(
      RAMSWAROOP_EMAIL,
      `Quote ${status}: ${expert.fullName}`,
      `<p>Quote for <strong>${expert.fullName}</strong> has been <strong>${status}</strong>.</p>
       ${rejectionNote ? `<p>Note: ${rejectionNote}</p>` : ""}`
    ).catch(console.error);

    res.json({ success: true });
  } catch (err) {
    console.error("approveQuote error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   UPLOAD TICKET
───────────────────────────────────────── */
exports.uploadTicket = async (req, res) => {
  try {
    const { expertId } = req.params;
    if (!req.file) return res.status(400).json({ message: "File required" });

    await ExpertTravel.update(
      { ticketPath: req.file.path, ticketUploadedAt: new Date() },
      { where: { expertId, cycle: CYCLE } }
    );

    const expert = await Expert.findByPk(expertId);
    const users  = await User.findAll({
      where: { role: { [Op.in]: ["DOFA", "ADOFA", "DOFA_OFFICE"] } },
    });

    const emails = users.map(u => u.email).join(",");
    if (emails) {
      await sendEmail(emails, `Ticket Uploaded: ${expert.fullName}`,
        `<p>Ticket uploaded for <strong>${expert.fullName}</strong>.</p>`
      ).catch(console.error);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("uploadTicket error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   UPLOAD INVOICE
───────────────────────────────────────── */
exports.uploadInvoice = async (req, res) => {
  try {
    const { expertId } = req.params;
    if (!req.file) return res.status(400).json({ message: "File required" });

    await ExpertTravel.update(
      { invoicePath: req.file.path, invoiceUploadedAt: new Date() },
      { where: { expertId, cycle: CYCLE } }
    );

    const expert = await Expert.findByPk(expertId);
    const users  = await User.findAll({
      where: { role: { [Op.in]: ["DOFA", "ADOFA", "DOFA_OFFICE"] } },
    });

    const emails = users.map(u => u.email).join(",");
    if (emails) {
      await sendEmail(emails, `Invoice Uploaded: ${expert.fullName}`,
        `<p>Invoice uploaded for <strong>${expert.fullName}</strong>.</p>`
      ).catch(console.error);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("uploadInvoice error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   SAVE PICKUP / DROP
   Writes to flat columns.
───────────────────────────────────────── */
exports.savePickupDrop = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { pickupLocation, pickupTime, dropLocation, dropTime } = req.body;

    await getOrCreate(expertId);

    await ExpertTravel.update(
      { pickupLocation, pickupTime, dropLocation, dropTime, enteredByDofa: true },
      { where: { expertId, cycle: CYCLE } }
    );

    await sendEmail(
      RAMSWAROOP_EMAIL,
      "Pickup / Drop Details Updated",
      `<p>Pickup from: <strong>${pickupLocation}</strong> at ${pickupTime}</p>
       <p>Drop to: <strong>${dropLocation}</strong> at ${dropTime}</p>`
    ).catch(console.error);

    res.json({ success: true });
  } catch (err) {
    console.error("savePickupDrop error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   SAVE DRIVER INFO
   Writes to flat columns.
───────────────────────────────────────── */
exports.saveDriverInfo = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { driverName, driverContact } = req.body;

    await ExpertTravel.update(
      { driverName, driverContact },
      { where: { expertId, cycle: CYCLE } }
    );

    const expert = await Expert.findByPk(expertId);
    const users  = await User.findAll({
      where: { role: { [Op.in]: ["DOFA", "ADOFA", "DOFA_OFFICE"] } },
    });

    const emails = users.map(u => u.email).join(",");
    if (emails) {
      await sendEmail(emails, `Driver Assigned: ${expert.fullName}`,
        `<p>Driver <strong>${driverName}</strong> (${driverContact}) assigned for ${expert.fullName}.</p>`
      ).catch(console.error);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("saveDriverInfo error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};