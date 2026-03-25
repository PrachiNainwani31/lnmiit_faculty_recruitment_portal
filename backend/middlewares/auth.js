const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = (roles = []) => {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization;
      if (!header) {
        return res.status(401).json({ msg: "No token provided" });
      }
      //console.log("AUTH HEADER:", req.headers.authorization);
      const token = header.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      //console.log("DECODED USER:", decoded);
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
        console.error("AUTH ERROR FULL:", err);
        return res.status(401).json({ msg: err.message });
      }
  };
};

module.exports = auth;
