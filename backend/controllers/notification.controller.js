const { Notification } = require("../models");

/* =====================================================
   GET NOTIFICATIONS
===================================================== */
exports.getNotifications = async (req, res) => {
  try {
    const { role, cycle } = req.query;

    const notifications = await Notification.findAll({
      where: { role, cycle },
      order: [["createdAt", "DESC"]],
    });

    res.json(notifications);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =====================================================
   MARK AS READ
===================================================== */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.update(
      { read: true },
      { where: { id } }
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};