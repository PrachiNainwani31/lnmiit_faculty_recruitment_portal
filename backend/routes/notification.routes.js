const express = require("express");
const {
  getNotifications,
  markAsRead,
} = require("../controllers/notification.controller");

const router = express.Router();

router.get("/", getNotifications);             // ?role=HoD&cycle=2026-27
router.post("/:id/read", markAsRead);

module.exports = router;
