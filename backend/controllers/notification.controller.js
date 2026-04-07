const { Notification } = require("../models");

exports.getNotifications = async (req, res) => {
  try {
    const { role, cycle } = req.query;
    const userId = req.user?.id || null;
    if (!role) return res.status(400).json({ error: "role required" });
    const { Op } = require("sequelize");

    const whereClause = { role };
    if (cycle) whereClause.cycle = cycle;   // ✅ only filter by cycle if provided

    whereClause[Op.or] = [{ targetUserId: null }];
    if (userId) whereClause[Op.or].push({ targetUserId: userId });

    const notifications = await Notification.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    res.json(notifications);
  } catch (err) {
    console.error("Notification error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.update({ read: true }, { where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};