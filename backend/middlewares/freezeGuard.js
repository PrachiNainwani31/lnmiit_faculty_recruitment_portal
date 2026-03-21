const RecruitmentCycle = require("../models/RecruitmentCycle");
const CYCLE = require("../config/activeCycle");

module.exports = async function freezeGuard(req, res, next) {
  try {
    const rc = await RecruitmentCycle.findOne({ cycle: CYCLE,hod:req.user._id });

    if (rc?.isFrozen) {
      return res.status(403).json({
        message: "Session is frozen. Editing is not allowed.",
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
