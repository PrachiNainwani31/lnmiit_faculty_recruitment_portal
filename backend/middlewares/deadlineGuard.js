const { PortalDeadline, RecruitmentCycle } = require("../models");

module.exports = async (req, res, next) => {
  try {
    // Get the latest cycle for this user or globally
    const email = req.user?.email;
    if (!email) return next();

    const candidate = await Candidate.findOne({ where: { email } });
    if (!candidate?.hodId || !candidate?.cycle) return next();

    // Scope deadline check to this candidate's specific HOD cycle
    const deadline = await PortalDeadline.findOne({
      where: { cycle: candidate.cycle, hodId: candidate.hodId },
    });
    if (!deadline) return next();

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