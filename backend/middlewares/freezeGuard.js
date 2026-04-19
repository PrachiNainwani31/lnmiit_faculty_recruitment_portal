// middlewares/freezeGuard.js — replace the isFrozen check
module.exports = async function freezeGuard(req, res, next) {
  try {
    const cycle = await getCurrentCycle(req.user.id);

    if (!cycle) return next();

    if (cycle.isClosed) {
      return res.status(403).json({ message: "This cycle is closed. No further edits are allowed." });
    }

    if (cycle.status === "QUERY") return next();

    if (cycle.isFrozen) {
      return res.status(403).json({ message: "This session is currently frozen. Editing is not allowed." });
    }

    next();
  } catch (err) {
    console.error("freezeGuard error:", err.message);
    res.status(500).json({ message: err.message });
  }
};