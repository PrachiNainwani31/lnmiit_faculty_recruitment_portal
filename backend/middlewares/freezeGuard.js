const RecruitmentCycle = require("../models/RecruitmentCycle");
const getCurrentCycle = require("../utils/getCurrentCycle");

module.exports = async function freezeGuard(req, res, next) {
  try {
      const cycle = await getCurrentCycle(req.user.id);
        if (cycle?.isClosed) {
          return res.status(403).json({ message: "No active cycle is found." });
        }
    if (cycle?.isFrozen) {
      return res.status(403).json({
        message: "Session is frozen. Editing is not allowed.",
      });
    }
    if (cycle.isClosed) {
      return res.status(403).json({
        message: "This cycle is closed. No further edits are allowed.",
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};