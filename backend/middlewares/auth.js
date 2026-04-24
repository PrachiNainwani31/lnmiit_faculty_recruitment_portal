const jwt = require("jsonwebtoken");
const { User } = require("../models");

const auth = (roles = []) => {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization;

      if (!header) {
        return res.status(401).json({ msg: "No token provided" });
      }

      const token = header.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let user = await User.findByPk(decoded.id);

      if (!user) {
        user = {
          id: decoded.id,
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
      console.error("AUTH ERROR:", err);
      return res.status(401).json({ msg: err.message });
    }
  };
};

module.exports = auth;