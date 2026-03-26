const { ExpertTravel, Expert, User } = require("../models");
const { sendEmail } = require("../utils/emailSender");
const { Op } = require("sequelize");
const CYCLE = require("../config/activeCycle");

const RAMSWAROOP_EMAIL = "bigav56562@paylaar.com";

/* ─────────────────────────────────────────
   helper: get or create
───────────────────────────────────────── */
async function getOrCreate(expertId) {
  let doc = await ExpertTravel.findOne({
    where: { expertId, cycle: CYCLE }
  });

  if (!doc) {
    doc = await ExpertTravel.create({
      expertId,
      cycle: CYCLE
    });
  }

  return doc;
}

/* ─────────────────────────────────────────
   GET ALL EXPERT TRAVEL
───────────────────────────────────────── */
exports.getAllExpertTravel = async (req, res) => {
  try {
    const experts = await Expert.findAll({
      include: [{ model: User, as: "uploadedBy", attributes: ["name", "department", "role"] }]
    });

    const travels = await ExpertTravel.findAll({
      where: { cycle: CYCLE }
    });

    const travelMap = {};
    travels.forEach(t => {
      travelMap[t.expertId] = t;
    });

    const result = experts.map(e => ({
      expert: e,
      travel: travelMap[e.id] || null
    }));

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   SAVE CONFIRMATION
───────────────────────────────────────── */
exports.saveConfirmation = async (req, res) => {
  try {
    const { expertId } = req.params;
    const data = req.body;

    let doc = await getOrCreate(expertId);

    await ExpertTravel.update(
      {
        confirmed: data.confirmed,
        contactNumber: data.contactNumber,
        presenceStatus: data.presenceStatus,
        onlineLink: data.onlineLink,
        modeOfTravel: data.modeOfTravel,
        traveller: data.traveller || {}
      },
      { where: { expertId, cycle: CYCLE } }
    );

    doc = await getOrCreate(expertId);

    const expert = await Expert.findByPk(expertId);

    if (data.presenceStatus === "Offline" && data.confirmed) {
      await sendEmail(
        RAMSWAROOP_EMAIL,
        `Travel Required: ${expert.fullName}`,
        `<p>Arrange travel for ${expert.fullName}</p>`
      );
    }

    res.json({ success: true, doc });

  } catch (err) {
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

    await ExpertTravel.update(
      {
        quote: {
          amount,
          vendor,
          remarks,
          submittedAt: new Date(),
          status: "PENDING"
        }
      },
      { where: { expertId, cycle: CYCLE } }
    );

    const expert = await Expert.findByPk(expertId);

    const dofaUsers = await User.findAll({
      where: { role: { [Op.in]: ["DOFA", "ADOFA"] } }
    });

    const emails = dofaUsers.map(u => u.email).join(",");

    await sendEmail(
      emails,
      `Quote Submitted: ${expert.fullName}`,
      `<p>Quote submitted ₹${amount}</p>`
    );

    res.json({ success: true });

  } catch (err) {
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

    const doc = await getOrCreate(expertId);

    const quote = doc.quote || {};

    quote.status = status;
    quote.approvedAt = new Date();
    quote.approvedBy = req.user.role;
    quote.rejectionNote = rejectionNote;

    await ExpertTravel.update(
      { quote },
      { where: { expertId, cycle: CYCLE } }
    );

    const expert = await Expert.findByPk(expertId);

    await sendEmail(
      RAMSWAROOP_EMAIL,
      `Quote ${status}`,
      `<p>${expert.fullName} → ${status}</p>`
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   UPLOAD TICKET
───────────────────────────────────────── */
exports.uploadTicket = async (req, res) => {
  try {
    const { expertId } = req.params;

    await ExpertTravel.update(
      {
        ticketPath: req.file.path,
        ticketUploadedAt: new Date()
      },
      { where: { expertId, cycle: CYCLE } }
    );

    const expert = await Expert.findByPk(expertId);

    const users = await User.findAll({
      where: { role: { [Op.in]: ["DOFA", "ADOFA", "DOFA_OFFICE"] } }
    });

    const emails = users.map(u => u.email).join(",");

    await sendEmail(emails, "Ticket Uploaded", `<p>${expert.fullName}</p>`);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   UPLOAD INVOICE
───────────────────────────────────────── */
exports.uploadInvoice = async (req, res) => {
  try {
    const { expertId } = req.params;

    await ExpertTravel.update(
      {
        invoicePath: req.file.path,
        invoiceUploadedAt: new Date()
      },
      { where: { expertId, cycle: CYCLE } }
    );

    const expert = await Expert.findByPk(expertId);

    const users = await User.findAll({
      where: { role: { [Op.in]: ["DOFA", "ADOFA", "DOFA_OFFICE"] } }
    });

    const emails = users.map(u => u.email).join(",");

    await sendEmail(emails, "Invoice Uploaded", `<p>${expert.fullName}</p>`);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   SAVE PICKUP DROP
───────────────────────────────────────── */
exports.savePickupDrop = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { pickupLocation, pickupTime, dropLocation, dropTime } = req.body;

    const doc = await getOrCreate(expertId);

    const pickupDrop = doc.pickupDrop || {};

    Object.assign(pickupDrop, {
      pickupLocation,
      pickupTime,
      dropLocation,
      dropTime,
      enteredByDofa: true
    });

    await ExpertTravel.update(
      { pickupDrop },
      { where: { expertId, cycle: CYCLE } }
    );

    await sendEmail(
      RAMSWAROOP_EMAIL,
      "Pickup updated",
      `<p>${pickupLocation}</p>`
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   SAVE DRIVER INFO
───────────────────────────────────────── */
exports.saveDriverInfo = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { driverName, driverContact } = req.body;

    const doc = await getOrCreate(expertId);

    const pickupDrop = doc.pickupDrop || {};

    pickupDrop.driverName = driverName;
    pickupDrop.driverContact = driverContact;

    await ExpertTravel.update(
      { pickupDrop },
      { where: { expertId, cycle: CYCLE } }
    );

    const expert = await Expert.findByPk(expertId);

    const users = await User.findAll({
      where: { role: { [Op.in]: ["DOFA", "ADOFA", "DOFA_OFFICE"] } }
    });

    const emails = users.map(u => u.email).join(",");

    await sendEmail(
      emails,
      "Driver Info",
      `<p>${driverName}</p>`
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};