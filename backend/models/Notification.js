const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  cycle: {
    type: String,
    required: true, // "2026-27"
  },
  role: {
    type: String,
    enum: ["HOD", "DOFA", "ADMIN"],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["STATUS", "COMMENT", "UPLOAD", "SYSTEM"],
    default: "SYSTEM",
  },
  read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
