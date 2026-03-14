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

/* ── REGISTER ── */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
 
    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "All fields are required" });
    }
 
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "Email already registered" });
 
    const user = await User.create({
      name,
      email,
      password,
      role,
      department: role === "HOD" ? department : undefined,
      active: true,
    });
 
    res.status(201).json({ msg: "Account created successfully", userId: user._id });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Registration failed" });
  }
});

module.exports = router;
