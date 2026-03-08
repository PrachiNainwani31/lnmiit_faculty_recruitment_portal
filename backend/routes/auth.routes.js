const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

/* LOGIN */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ msg: "Invalid credentials" });
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    return res.status(400).json({ msg: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      department: user.department,
    },
  });
});

module.exports = router;
