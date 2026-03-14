const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = (roles = []) => {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization;
      if (!header) {
        return res.status(401).json({ msg: "No token provided" });
      }

      const token = header.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let user = await User.findById(decoded.id);

      /* Allow hardcoded candidate accounts */
      if (!user) {
        user = {
          _id: decoded.id,
          role: decoded.role,
          active: true
        };
      }

      if (!user.active) {
        return res.status(401).json({ msg: "Invalid user" });
      }

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ msg: "Access denied" });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ msg: "Authentication failed" });
    }
  };
};

module.exports = auth;
