const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const { ActivityLog } = require("../models");
const { Op } = require("sequelize");

// View logs — DOFA Office and DOFA only
router.get("/", auth(["DOFA", "DOFA_OFFICE"]), async (req, res) => {
  try {
    const { role, action, from, to, limit = 200 } = req.query;
    const where = {};
    if (role)   where.userRole = role;
    if (action) where.action   = action;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to)   where.createdAt[Op.lte] = new Date(to);
    }
    const logs = await ActivityLog.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;