const { ExpertTravel, Expert, User } = require("../models");
const { sendEmail } = require("../utils/emailSender");
const templates     = require("../utils/emailTemplates");
const { Op }        = require("sequelize");
const getCurrentCycle = require("../utils/getCurrentCycle");

// ✅ No TRAVEL_EMAIL env var — query travel users from DB
async function emailTravelUsers(tmpl) {
  const travelUsers = await User.findAll({ where: { role: "REGISTRAR_OFFICE" } });
  for (const u of travelUsers) {
    await sendEmail(u.email, tmpl.subject, tmpl.html).catch(console.error);
  }
}

async function getOrCreate(expertId) {
  const expert = await Expert.findByPk(expertId);
  const cycle  = expert?.cycle || "UNKNOWN";
  let doc = await ExpertTravel.findOne({ where: { expertId, cycle } });
  if (!doc) doc = await ExpertTravel.create({ expertId, cycle });
  return doc;
}

function toNestedShape(t) {
  if (!t) return null;
  const raw = t.toJSON ? t.toJSON() : { ...t };
  return {
    ...raw,
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
    quote: raw.quoteAmount != null ? {
      amount:        raw.quoteAmount,
      vendor:        raw.quoteVendor,
      remarks:       raw.quoteRemarks,
      status:        raw.quoteStatus || "PENDING",
      submittedAt:   raw.quoteSubmittedAt,
      approvedAt:    raw.quoteApprovedAt,
      approvedBy:    raw.quoteApprovedBy,
      rejectionNote: raw.quoteRejectionNote,
    } : null,
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

exports.getAllExpertTravel = async (req, res) => {
  try {
    const { RecruitmentCycle } = require("../models");

    const activeCycles = await RecruitmentCycle.findAll({
      attributes: ["cycle", "hodId"],
      where: { [Op.or]: [{ isClosed: false }, { isClosed: null }, { isClosed: 0 }] },
    });
    const activeHodIds = new Set(activeCycles.map(c => c.hodId).filter(Boolean));
    const activeCycleStrings = [...new Set(activeCycles.map(c => c.cycle))];

    // ✅ Get HOD-uploaded experts from active cycles
    const hodExperts = activeCycleStrings.length ? await Expert.findAll({
      where: {
        cycle: activeCycleStrings,
        uploadedById: { [Op.in]: [...activeHodIds] },
      },
      include: [{ model: User, as: "uploadedBy", attributes: ["name", "department", "role"] }],
    }) : [];

    // ✅ Get DOFA-manually-added experts from active cycles (uploadedById is DOFA user)
    const dofaUsers = await User.findAll({
      where: { role: { [Op.in]: ["DOFA", "ADOFA", "DOFA_OFFICE"] } },
      attributes: ["id"],
    });
    const dofaUserIds = dofaUsers.map(u => u.id);

    const dofaExperts = activeCycleStrings.length && dofaUserIds.length ? await Expert.findAll({
      where: {
        cycle: activeCycleStrings,
        uploadedById: { [Op.in]: dofaUserIds },
      },
      include: [{ model: User, as: "uploadedBy", attributes: ["name", "department", "role"] }],
    }) : [];

    const allExperts = [...hodExperts, ...dofaExperts];

    const travels = await ExpertTravel.findAll();
    const travelMap = {};
    travels.forEach(t => { travelMap[t.expertId] = t; });

    const result = allExperts.map(e => ({
      expert: e,
      travel: toNestedShape(travelMap[e.id]) || null,
    }));

    res.json(result);
  } catch (err) {
    console.error("getAllExpertTravel error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
/* ── Save confirmation + travel details (#10a) ── */
exports.saveConfirmation = async (req, res) => {
  try {
    const { expertId } = req.params;
    const data = req.body;
    const tr   = data.traveller || {};

    await getOrCreate(expertId);
    const expert = await Expert.findByPk(expertId);
    const cycle  = expert?.cycle;
    await ExpertTravel.update(
      {
        confirmed:      data.confirmed,
        contactNumber:  data.contactNumber,
        presenceStatus: data.presenceStatus,
        onlineLink:     data.onlineLink  || null,
        modeOfTravel:   data.modeOfTravel || null,
        travellerName:           tr.name              || null,
        travellerGender:         tr.gender             || null,
        travellerAge:            tr.age ? Number(tr.age) : null,
        travellerMealPreference: tr.mealPreference     || null,
        travellerPreferredSeat:  tr.preferredSeat      || null,
        travellerJourneyType:    tr.journeyType        || "Direct",
        travellerOnwardFrom:     tr.onwardFrom ? new Date(tr.onwardFrom) : null,
        travellerOnwardTime:     tr.onwardTime         || null,
        travellerOnwardFromCity: tr.onwardFromCity     || null,
        travellerOnwardToCity:   tr.onwardToCity       || null,
        travellerOnwardFlightNo: tr.onwardFlightNo     || null,
        travellerReturnFrom:     tr.returnFrom ? new Date(tr.returnFrom) : null,
        travellerReturnTime:     tr.returnTime         || null,
        travellerReturnFromCity: tr.returnFromCity     || null,
        travellerReturnToCity:   tr.returnToCity       || null,
        travellerReturnFlightNo: tr.returnFlightNo     || null,
        travellerConnections:       tr.connections       || [],
        travellerReturnConnections: tr.returnConnections || [],
      },
      { where: { expertId, cycle } }
    );

    const doc    = await getOrCreate(expertId);

    // Email #10a — send travel details to Travel portal users (Offline only)
    if (data.presenceStatus === "Offline" && data.confirmed) {
      const tmpl = templates.travelDetailsToTravel({
        expertName:    expert.fullName,
        expertId:      expert.id,
        department:    expert.department,
        travelDetails: {
          mode:           data.modeOfTravel    || "—",
          from:           tr.onwardFromCity    || "—",
          interviewDate:  tr.onwardFrom        || "—",
          presenceStatus: data.presenceStatus,
        },
      });
      await emailTravelUsers(tmpl);
    }

    res.json({ success: true, doc: toNestedShape(doc) });
  } catch (err) {
    console.error("saveConfirmation error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ── Submit quote (#10b) — email to DOFA ── */
exports.submitQuote = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { amount, vendor, remarks } = req.body;
    const expert = await Expert.findByPk(expertId);
    const cycle  = expert?.cycle;
    await getOrCreate(expertId);
    await ExpertTravel.update(
      {
        quoteAmount:        Number(amount),
        quoteVendor:        vendor  || null,
        quoteRemarks:       remarks || null,
        quoteStatus:        "PENDING",
        quoteSubmittedAt:   new Date(),
        quoteApprovedAt:    null,
        quoteApprovedBy:    null,
        quoteRejectionNote: null,
      },
      { where: { expertId, cycle } }
    );

    const dofaUsers = await User.findAll({
      where: { role: { [Op.in]: ["DOFA", "ADOFA"] } },
    });
    const tmpl = templates.travelQuoteToDofa({
      expertName:   expert.fullName,
      expertId:     expert.id,
      quoteAmount:  Number(amount),
      quoteDetails: remarks || vendor || "—",
    });
    for (const u of dofaUsers) {
      await sendEmail(u.email, tmpl.subject, tmpl.html).catch(console.error);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("submitQuote error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ── Approve quote (#10c) — email to Travel users ── */
exports.approveQuote = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { status, rejectionNote } = req.body;

    const expert = await Expert.findByPk(expertId);  // ← move up
    const cycle  = expert?.cycle;                     // ← move up

    const existing = await ExpertTravel.findOne({ where: { expertId, cycle } }); // ← now valid

    await ExpertTravel.update(
      {
        quoteStatus:        status,
        quoteApprovedAt:    new Date(),
        quoteApprovedBy:    req.user.role,
        quoteRejectionNote: rejectionNote || null,
      },
      { where: { expertId, cycle } }
    );

    if (status === "APPROVED") {
      const tmpl = templates.quoteApprovedToTravel({
        expertName:  expert.fullName,
        expertId:    expert.id,
        quoteAmount: existing?.quoteAmount || "—",
      });
      await emailTravelUsers(tmpl);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("approveQuote error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ── Upload ticket (#10d) — email to DOFA Office ── */
exports.uploadTicket = async (req, res) => {
  try {
    const { expertId } = req.params;
    if (!req.file) return res.status(400).json({ message: "File required" });
    const expert = await Expert.findByPk(expertId);
    const cycle  = expert?.cycle;
    await ExpertTravel.update(
      { ticketPath: req.file.path, ticketUploadedAt: new Date() },
      { where: { expertId, cycle} }
    );

    const dofaOfficeUsers = await User.findAll({ where: { role: "DOFA_OFFICE" } });
    const tmpl = templates.ticketUpdatedToDofaOffice({
      expertName:    expert.fullName,
      expertId:      expert.id,
      ticketDetails: "Ticket has been booked. Please check the portal for full details.",
    });
    for (const u of dofaOfficeUsers) {
      await sendEmail(u.email, tmpl.subject, tmpl.html).catch(console.error);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("uploadTicket error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ── Upload invoice — no email required per list ── */
exports.uploadInvoice = async (req, res) => {
  try {
    const { expertId } = req.params;
    if (!req.file) return res.status(400).json({ message: "File required" });
    const expert = await Expert.findByPk(expertId);
    const cycle  = expert?.cycle;
    await ExpertTravel.update(
      { invoicePath: req.file.path, invoiceUploadedAt: new Date() },
      { where: { expertId, cycle } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("uploadInvoice error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ── Save pickup/drop (#10e) — email to Travel users ── */
exports.savePickupDrop = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { pickupLocation, pickupTime, dropLocation, dropTime } = req.body;
    const expert = await Expert.findByPk(expertId);
    const cycle  = expert?.cycle;
    await getOrCreate(expertId);
    await ExpertTravel.update(
      { pickupLocation, pickupTime, dropLocation, dropTime, enteredByDofa: true },
      { where: { expertId, cycle } }
    );

    const tmpl = templates.pickupDetailsToTravel({
      expertName: expert.fullName,
      expertId:   expert.id,
      pickupDetails: { pickupLocation, pickupTime, dropLocation },
    });
    await emailTravelUsers(tmpl);

    res.json({ success: true });
  } catch (err) {
    console.error("savePickupDrop error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ── Save driver info (#10f) — email to DOFA Office ── */
exports.saveDriverInfo = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { driverName, driverContact } = req.body;
    const expert = await Expert.findByPk(expertId);
    const cycle  = expert?.cycle;
    await ExpertTravel.update(
      { driverName, driverContact },
      { where: { expertId, cycle } }
    );

    const dofaOfficeUsers = await User.findAll({ where: { role: "DOFA_OFFICE" } });
    const tmpl = templates.driverDetailsToDofaOffice({
      expertName: expert.fullName,
      expertId:   expert.id,
      driverDetails: { driverName, driverContact, vehicleNumber: "—" },
    });
    for (const u of dofaOfficeUsers) {
      await sendEmail(u.email, tmpl.subject, tmpl.html).catch(console.error);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("saveDriverInfo error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};