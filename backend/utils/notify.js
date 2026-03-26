const {Notification} = require("../models");

exports.createNotification = async ({ cycle, role, title, message, type }) => {
  try {
    await Notification.create({
      cycle,
      role,
      title,
      message,
      type,
    });
  } catch (err) {
    console.error("Notification Error:", err.message);
  }
};
