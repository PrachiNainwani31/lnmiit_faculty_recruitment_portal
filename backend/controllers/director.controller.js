const { OfficeOrder, User } = require("../models");
const { sendEmail } = require("../utils/emailSender");
const CYCLE = require("../config/activeCycle");

/* =====================================================
   UPLOAD OFFICE ORDER
===================================================== */
exports.uploadOfficeOrder = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "PDF file required" });

    const { orderNumber, orderDate } = req.body;

    if (!orderNumber || !orderDate)
      return res.status(400).json({ message: "Order number and date required" });

    const order = await OfficeOrder.create({
      orderNumber,
      orderDate,
      pdfPath: req.file.path,
      cycle: CYCLE,
      uploadedById: req.user.id,
      locked: true,
    });

    // ✅ FIX: Mongo → Sequelize
    const dofaUsers = await User.findAll({
      where: { role: ["DOFA", "ADOFA"] } // works in Sequelize
    });

    for (const u of dofaUsers) {
      await sendEmail(
        u.email,
        `Interview Panel Office Order Uploaded — ${CYCLE}`,
        `<p>Office order uploaded. Please check portal.</p>`
      ).catch(console.error);
    }

    res.json({ success: true, order });

  } catch (err) {
    console.error("uploadOfficeOrder error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

/* =====================================================
   GET OFFICE ORDERS (FILTERED)
===================================================== */
exports.getOfficeOrders = async (req, res) => {
  try {
    const orders = await OfficeOrder.findAll({
      where: { cycle: CYCLE },
      include: [
        {
          model: User,
          as: "uploadedBy",
          attributes: ["name", "email"]
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/* =====================================================
   GET ALL OFFICE ORDERS
===================================================== */
exports.getAllOfficeOrders = async (req, res) => {
  try {
    const orders = await OfficeOrder.findAll({
      include: [
        {
          model: User,
          as: "uploadedBy",
          attributes: ["name", "email"]
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};