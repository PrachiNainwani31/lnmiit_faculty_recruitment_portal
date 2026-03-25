const ExpertTravel = require("../models/Experttravel");
const Expert       = require("../models/Expert");
const User         = require("../models/User");
const { sendEmail } = require("../utils/emailSender");
const CYCLE        = require("../config/activeCycle");

const RAMSWAROOP_EMAIL = "bigav56562@paylaar.com";

/* ─────────────────────────────────────────
   helper: get or create ExpertTravel doc
───────────────────────────────────────── */
async function getOrCreate(expertId) {
  let doc = await ExpertTravel.findOne({
    expert: expertId,
    cycle: CYCLE   // ADD THIS
  });

  if (!doc) {
    doc = await ExpertTravel.create({
      expert: expertId,
      cycle: CYCLE
    });
  }

  return doc;
}

/* ─────────────────────────────────────────
   GET ALL EXPERTS WITH TRAVEL STATUS
   Used by DOFA Office + Ramswaroop
───────────────────────────────────────── */
exports.getAllExpertTravel = async (req, res) => {
  try {
    const experts = await Expert.find()
      .populate("uploadedBy", "name department role");

    const travels = await ExpertTravel.find({ cycle: CYCLE });
    const travelMap = {};
    travels.forEach(t => { travelMap[t.expert.toString()] = t; });

    const result = experts.map(e => ({
      expert:  e,
      travel:  travelMap[e._id.toString()] || null,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   DOFA OFFICE: Save confirmation + travel details
───────────────────────────────────────── */
exports.saveConfirmation = async (req, res) => {
  try {
    console.log("CYCLE VALUE:", CYCLE);
    const { expertId } = req.params;
    const {
      confirmed, contactNumber, presenceStatus,
      onlineLink, modeOfTravel, traveller,
    } = req.body;

    const doc = await getOrCreate(expertId);

    doc.confirmed      = confirmed;
    doc.contactNumber  = contactNumber;
    doc.presenceStatus = presenceStatus;
    doc.onlineLink     = onlineLink;
    doc.modeOfTravel   = modeOfTravel;
    if (traveller) {
    const cleanTraveller = {
      ...traveller,

      // 🔥 FIX DATE FIELDS
      onwardFrom: traveller.onwardFrom || null,
      returnFrom: traveller.returnFrom || null,

      // optional but safe
      onwardTime: traveller.onwardTime || null,
      returnTime: traveller.returnTime || null,

      // ensure arrays exist
      connections: traveller.connections || [],
      returnConnections: traveller.returnConnections || [],
    };

    doc.traveller = cleanTraveller;
  }

    await doc.save();

    const expert = await Expert.findById(expertId);

    // Notify Ramswaroop if offline
    if (presenceStatus === "Offline" && confirmed) {
      await sendEmail(
        RAMSWAROOP_EMAIL,
        `Travel Arrangement Required: ${expert.fullName}`,
        `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
          <div style="background:#0c2340;color:#fff;padding:15px;text-align:center;border-radius:6px 6px 0 0">
            <h2 style="margin:0">LNMIIT — Travel Portal</h2>
          </div>
          <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
            <p>Dear Ramswaroop Sharma,</p>
            <p>Please arrange travel for the following expert attending the faculty recruitment interview:</p>
            <table style="width:100%;font-size:14px;margin:16px 0">
              <tr><td style="color:#666;padding:4px 0">Expert</td><td><strong>${expert.fullName}</strong></td></tr>
              <tr><td style="color:#666;padding:4px 0">Institute</td><td>${expert.institute}</td></tr>
              <tr><td style="color:#666;padding:4px 0">Mode</td><td>${modeOfTravel}</td></tr>
              <tr><td style="color:#666;padding:4px 0">Contact</td><td>${contactNumber}</td></tr>
              ${traveller ? `
                <tr>
                  <td style="color:#666;padding:4px 0">Journey Type</td>
                  <td>${traveller.journeyType}</td>
                </tr>

                ${
                  traveller.journeyType === "Connecting"
                    ? `
                <tr>
                  <td style="color:#666;padding:4px 0">Onward</td>
                  <td>
                    ${
                      traveller.connections?.length
                        ? traveller.connections.map(
                            leg => `${leg.from} → ${leg.to} (${leg.date} ${leg.time})`
                          ).join("<br>")
                        : "—"
                    }
                  </td>
                </tr>

                <tr>
                  <td style="color:#666;padding:4px 0">Return</td>
                  <td>
                    ${
                      traveller.returnConnections?.length
                        ? traveller.returnConnections.map(
                            leg => `${leg.from} → ${leg.to} (${leg.date} ${leg.time})`
                          ).join("<br>")
                        : "—"
                    }
                  </td>
                </tr>
                `
                    : `
                <tr>
                  <td style="color:#666;padding:4px 0">Onward</td>
                  <td>
                    ${traveller.onwardFrom ? new Date(traveller.onwardFrom).toDateString() : "—"}
                    →
                    ${traveller.onwardTo ? new Date(traveller.onwardTo).toDateString() : "—"}
                  </td>
                </tr>

                <tr>
                  <td style="color:#666;padding:4px 0">Return</td>
                  <td>
                    ${traveller.returnFrom ? new Date(traveller.returnFrom).toDateString() : "—"}
                    →
                    ${traveller.returnTo ? new Date(traveller.returnTo).toDateString() : "—"}
                  </td>
                </tr>
                `
                }
                `
                : ""}
            </table>
            <p>Please log in to the Travel Portal and submit a quote at the earliest.</p>
            <p>Best regards,<br><strong>DOFA Office</strong><br>LNMIIT</p>
          </div>
        </div>
        `
      ).catch(err => console.error("Ramswaroop email failed:", err.message));
    }

    res.json({ success: true, doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   RAMSWAROOP: Submit quote
───────────────────────────────────────── */
exports.submitQuote = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { amount, vendor, remarks } = req.body;

    const doc = await getOrCreate(expertId);
    doc.quote = { amount, vendor, remarks, submittedAt: new Date(), status: "PENDING" };
    await doc.save();

    const expert = await Expert.findById(expertId);

    // Notify DOFA + ADoFA
    const dofaUsers = await User.find({ role: { $in: ["DOFA", "ADOFA"] } });
    const dofaEmails = dofaUsers.map(u => u.email).join(",");

    await sendEmail(
      dofaEmails,
      `Travel Quote Submitted: ${expert.fullName}`,
      `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
        <div style="background:#0c2340;color:#fff;padding:15px;text-align:center;border-radius:6px 6px 0 0">
          <h2 style="margin:0">LNMIIT — Travel Portal</h2>
        </div>
        <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
          <p>A travel quote has been submitted by Mr. Ramswaroop Sharma:</p>
          <table style="width:100%;font-size:14px;margin:16px 0">
            <tr><td style="color:#666;padding:4px 0">Expert</td><td><strong>${expert.fullName}</strong></td></tr>
            <tr><td style="color:#666;padding:4px 0">Amount</td><td>₹${amount}</td></tr>
            <tr><td style="color:#666;padding:4px 0">Vendor</td><td>${vendor}</td></tr>
            <tr><td style="color:#666;padding:4px 0">Remarks</td><td>${remarks || "—"}</td></tr>
          </table>
          <p>Please log in to the portal to approve or reject this quote.</p>
        </div>
      </div>
      `
    ).catch(err => console.error("DOFA quote email failed:", err.message));

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   DOFA/ADOFA: Approve or reject quote
───────────────────────────────────────── */
exports.approveQuote = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { status, rejectionNote } = req.body; // "APPROVED" | "REJECTED"

    const doc = await getOrCreate(expertId);
    if (!doc.quote) return res.status(400).json({ message: "No quote to approve" });

    doc.quote.status       = status;
    doc.quote.approvedAt   = new Date();
    doc.quote.approvedBy   = req.user.role;
    doc.quote.rejectionNote= rejectionNote;
    doc.markModified("quote");
    await doc.save();

    const expert = await Expert.findById(expertId);

    // Notify Ramswaroop of decision
    await sendEmail(
      RAMSWAROOP_EMAIL,
      `Quote ${status}: ${expert.fullName}`,
      `
      <p>Dear Ramswaroop,</p>
      <p>Your quote of ₹${doc.quote.amount} for <strong>${expert.fullName}</strong> has been <strong>${status}</strong>.</p>
      ${rejectionNote ? `<p>Reason: ${rejectionNote}</p>` : ""}
      ${status === "APPROVED" ? "<p>Please proceed with booking the ticket.</p>" : ""}
      <p>Best regards,<br>DOFA Office, LNMIIT</p>
      `
    ).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   RAMSWAROOP: Upload ticket
───────────────────────────────────────── */
exports.uploadTicket = async (req, res) => {
  try {
    const { expertId } = req.params;
    if (!req.file) return res.status(400).json({ message: "File required" });

    const doc = await getOrCreate(expertId);
    doc.ticketPath       = req.file.path;
    doc.ticketUploadedAt = new Date();
    await doc.save();

    const expert = await Expert.findById(expertId);

    // Notify DOFA Office + DOFA/ADoFA
    const notifyUsers = await User.find({ role: { $in: ["DOFA", "ADOFA", "DOFA_OFFICE"] } });
    const emails = notifyUsers.map(u => u.email).join(",");

    await sendEmail(
      emails,
      `Ticket Uploaded: ${expert.fullName}`,
      `<p>Mr. Ramswaroop has uploaded the travel ticket for <strong>${expert.fullName}</strong>. Please log in to view it.</p>`
    ).catch(() => {});

    res.json({ success: true, path: req.file.path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   RAMSWAROOP: Upload invoice
───────────────────────────────────────── */
exports.uploadInvoice = async (req, res) => {
  try {
    const { expertId } = req.params;
    if (!req.file) return res.status(400).json({ message: "File required" });

    const doc = await getOrCreate(expertId);
    doc.invoicePath       = req.file.path;
    doc.invoiceUploadedAt = new Date();
    await doc.save();

    const expert = await Expert.findById(expertId);

    const notifyUsers = await User.find({ role: { $in: ["DOFA", "ADOFA", "DOFA_OFFICE"] } });
    const emails = notifyUsers.map(u => u.email).join(",");

    await sendEmail(
      emails,
      `Invoice Uploaded: ${expert.fullName}`,
      `<p>Final invoice uploaded for <strong>${expert.fullName}</strong>. Please log in to review.</p>`
    ).catch(() => {});

    res.json({ success: true, path: req.file.path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   DOFA OFFICE: Save pickup / drop-off details
───────────────────────────────────────── */
exports.savePickupDrop = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { pickupLocation, pickupTime, dropLocation, dropTime } = req.body;

    const doc = await getOrCreate(expertId);
    doc.pickupDrop = {
      ...doc.pickupDrop,
      pickupLocation, pickupTime, dropLocation, dropTime,
      enteredByDofa: true,
    };
    doc.markModified("pickupDrop");
    await doc.save();

    // Notify Ramswaroop
    await sendEmail(
      RAMSWAROOP_EMAIL,
      "Pickup / Drop-off Details Updated",
      `
      <p>Dear Ramswaroop,</p>
      <p>Pickup/drop-off details have been updated:</p>
      <p>Pickup: ${pickupLocation} at ${pickupTime}</p>
      <p>Drop: ${dropLocation} at ${dropTime}</p>
      <p>Please book the cab accordingly and enter driver details on the portal.</p>
      `
    ).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────
   RAMSWAROOP: Enter driver info
───────────────────────────────────────── */
exports.saveDriverInfo = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { driverName, driverContact } = req.body;

    const doc = await getOrCreate(expertId);
    doc.pickupDrop = { ...doc.pickupDrop, driverName, driverContact };
    doc.markModified("pickupDrop");
    await doc.save();

    const expert = await Expert.findById(expertId);

    const notifyUsers = await User.find({ role: { $in: ["DOFA", "ADOFA", "DOFA_OFFICE"] } });
    const emails = notifyUsers.map(u => u.email).join(",");

    await sendEmail(
      emails,
      `Driver Info Updated: ${expert.fullName}`,
      `<p>Driver details: ${driverName}, ${driverContact}</p>`
    ).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};