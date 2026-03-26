const { Comment, RecruitmentCycle } = require("../models");
const CYCLE = require("../config/activeCycle");

/* =====================================================
   GET COMMENTS
===================================================== */
exports.getComments = async (req, res) => {
  const comments = await Comment.findAll({
    where: { cycle: CYCLE },
    order: [["createdAt", "ASC"]],
  });

  res.json(comments);
};

/* =====================================================
   ADD COMMENT
===================================================== */
exports.addComment = async (req, res) => {
  const { message } = req.body;

  if (!message)
    return res.status(400).json({ message: "Message required" });

  const role = req.user.role;

  const comment = await Comment.create({
    cycle: CYCLE,
    fromRole: role,
    toRole: role === "HOD" ? "DOFA" : "HOD",
    message,
  });

  // 🔓 If DOFA comments → unfreeze cycle
  if (role === "DOFA") {
    await RecruitmentCycle.update(
      { isFrozen: false, status: "QUERY" },
      { where: { cycle: CYCLE } }
    );
  }

  res.json(comment);
};