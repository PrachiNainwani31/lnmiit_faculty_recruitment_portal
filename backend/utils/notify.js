// utils/notify.js
const { Notification } = require("../models");

exports.createNotification = async ({
  cycle, role, title, message, type = "SYSTEM", targetUserId = null,
}) => {
  try {
    await Notification.create({ cycle, role, title, message, type, targetUserId });
  } catch (err) {
    console.error("createNotification error:", err.message);
  }
};