const { PortalDeadline, RecruitmentCycle } = require("../models");

module.exports = async (req, res, next) => {
  try {
    // Get the latest cycle for this user or globally
    const cycle = await RecruitmentCycle.findOne({ order: [["createdAt","DESC"]] });
    if (!cycle) return next(); // no cycle = no deadline yet

    const deadline = await PortalDeadline.findOne({ where: { cycle: cycle.cycle } });
    if (!deadline) return next(); // no deadline set = open

    const now = new Date();
    if (now > new Date(deadline.deadlineAt)) {
      return res.status(403).json({
        message: "The application deadline has passed. The portal is now closed.",
        deadlinePassed: true,
        deadlineAt: deadline.deadlineAt,
      });
    }

    next();
  } catch (err) {
    next(); // don't block on error
  }
};