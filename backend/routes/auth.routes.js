const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { log } = require("../utils/activityLogger");

const router = express.Router();

/* LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ msg: "Email and password are required" });

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(400).json({ msg: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok)
      return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    await log({
      user:        req.user,
      action:      "USER_LOGGED_IN",
      entity:      "USER",
      entityId:    user.id,
      description: `User logged in: ${user.id}`,
      req,
    });

    res.json({
      token,
      user: {
        id:         user.id,
        name:       user.name,
        role:       user.role,
        department: user.department,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Login failed" });
  }
});

/* ── REGISTER ── */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
 
    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "All fields are required" });
    }
 
    const exists = await User.findOne({where:{ email }});
    if (exists) return res.status(400).json({ msg: "Email already registered" });
 
    const user = await User.create({
      name,
      email,
      password,
      role,
      department: role === "HOD" ? department : undefined,
      active: true,
    });
 
    res.status(201).json({ msg: "Account created successfully", userId: user.id });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Registration failed" });
  }
});

module.exports = router;
