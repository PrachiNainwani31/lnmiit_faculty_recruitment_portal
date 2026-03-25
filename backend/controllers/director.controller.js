const OfficeOrder = require("../models/OfficeOrder");
const { sendEmail } = require("../utils/emailSender");
const User  = require("../models/User");
const CYCLE = require("../config/activeCycle");

exports.uploadOfficeOrder = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF file required" });

    const { orderNumber, orderDate } = req.body;
    if (!orderNumber || !orderDate)
      return res.status(400).json({ message: "Order number and date required" });

    const order = await OfficeOrder.create({
      orderNumber,
      orderDate,
      pdfPath:    req.file.path,
      cycle:      CYCLE,
      uploadedBy: req.user._id,
      locked:     true,
    });

    // Notify DOFA
    const dofaUsers = await User.find({ role: { $in: ["DOFA", "ADOFA"] } });
    for (const u of dofaUsers) {
      await sendEmail(
        u.email,
        `Interview Panel Office Order Uploaded — ${CYCLE}`,
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
          <div style="background:#8b0000;color:#fff;padding:15px;text-align:center;border-radius:6px 6px 0 0">
            <h2 style="margin:0">LNMIIT Recruitment Portal</h2>
          </div>
          <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
            <p>The Director's Office has uploaded the Interview Panel Office Order.</p>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Date:</strong> ${new Date(orderDate).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}</p>
            <p>Please log in to the portal to view the document.</p>
            <p>With Regards,<br>Director's Office<br>LNMIIT</p>
          </div>
        </div>`
      ).catch(console.error);
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error("uploadOfficeOrder error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

exports.getOfficeOrders = async (req, res) => {
  try {
    const orders = await OfficeOrder.find({ cycle: CYCLE })
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name email");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

exports.getAllOfficeOrders = async (req, res) => {
  try {
    const orders = await OfficeOrder.find()
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name email");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};