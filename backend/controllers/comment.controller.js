const { Comment, RecruitmentCycle, User } = require("../models");
const getCurrentCycle = require("../utils/getCurrentCycle");
const { Op } = require("sequelize");

/* ── GET COMMENTS ── */
exports.getComments = async (req, res) => {
  try {
    const role = req.user.role;

    if (role === "HOD") {
      // HOD: fetch their own cycle, filter to their comments
      const hodCycle = await getCurrentCycle(req.user.id);
      if (!hodCycle)
        return res.status(404).json({ message: "No active cycle found" });

      const comments = await Comment.findAll({
        where: {
          cycle: hodCycle.cycle,
          [Op.or]: [
            { targetUserId: req.user.id },                               // DOFA → this HOD
            { fromRole: "HOD", fromDepartment: req.user.department },    // this HOD's sent messages
          ],
        },
        order: [["createdAt", "ASC"]],
      });

      return res.json(comments);
    }

    // DOFA / DOFA_OFFICE: see all comments across all cycles
    // Optionally filter by ?hodId=X from query param
    const { hodId } = req.query;

    if (hodId) {
      const hodCycle = await getCurrentCycle(hodId);
      if (!hodCycle)
        return res.status(404).json({ message: "No active cycle for this HOD" });

      const comments = await Comment.findAll({
        where: { cycle: hodCycle.cycle },
        order: [["createdAt", "ASC"]],
      });
      return res.json(comments);
    }

    // No filter — return all comments (DOFA overview)
    const comments = await Comment.findAll({
      order: [["createdAt", "DESC"]],
    });
    return res.json(comments);

  } catch (err) {
    console.error("getComments error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ── ADD COMMENT ── */
exports.addComment = async (req, res) => {
  try {
    const { message, targetHodId } = req.body;
    if (!message?.trim())
      return res.status(400).json({ message: "Message required" });

    const role = req.user.role;
    let cycleString, targetUserId = null, fromDepartment = null;

    if (role === "HOD") {
      // HOD commenting → look up their own cycle
      const hodCycle = await getCurrentCycle(req.user.id);
      if (!hodCycle)
        return res.status(404).json({ message: "No active cycle found" });

      cycleString    = hodCycle.cycle;
      fromDepartment = req.user.department || null;

      // If department is missing on req.user, re-fetch
      if (!fromDepartment) {
        const userDoc = await User.findByPk(req.user.id);
        fromDepartment = userDoc?.department || null;
      }

    } else {
      // DOFA / DOFA_OFFICE → must provide targetHodId to identify whose cycle to post in
      if (!targetHodId)
        return res.status(400).json({ message: "targetHodId is required for DOFA comments" });

      const hodCycle = await getCurrentCycle(targetHodId);
      if (!hodCycle)
        return res.status(404).json({ message: "No active cycle found for this HOD" });

      cycleString  = hodCycle.cycle;
      targetUserId = parseInt(targetHodId, 10);

      // Unfreeze cycle when DOFA raises a comment/query
      await RecruitmentCycle.update(
        { isFrozen: false, status: "QUERY" },
        { where: { cycle: cycleString, hodId: targetHodId } }
      );
    }

    const comment = await Comment.create({
      cycle:          cycleString,
      fromRole:       role,
      fromDepartment,
      toRole:         role === "HOD" ? "DOFA" : "HOD",
      targetUserId,   // null when HOD posts, set to hodId when DOFA posts
      message:        message.trim(),
    });

    res.json(comment);

  } catch (err) {
    console.error("addComment error:", err);
    res.status(500).json({ message: err.message });
  }
};