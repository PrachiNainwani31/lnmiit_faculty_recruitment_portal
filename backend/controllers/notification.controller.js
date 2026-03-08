const Notification = require("../models/Notification");

// Get notifications by role & cycle
exports.getNotifications = async (req, res) => {
  try {
    const { role, cycle } = req.query;

    const notifications = await Notification.find({ role, cycle })
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
