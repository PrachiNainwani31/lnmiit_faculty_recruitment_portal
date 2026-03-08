const Comment = require("../models/Comment");
const CYCLE = require("../config/activeCycle");
const RecruitmentCycle = require("../models/RecruitmentCycle");

exports.getComments = async (req, res) => {
  const comments = await Comment.find({ cycle: CYCLE }).sort({ createdAt: 1 });
  res.json(comments);
};

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

  // 🔓 If DOFA comments → unfreeze
  if (role === "DOFA") {
    await RecruitmentCycle.updateOne(
      { cycle: CYCLE },
      { isFrozen: false, status: "QUERY" }
    );
  }

  res.json(comment);
};
