const bcrypt    = require("bcryptjs");
const { User }  = require("../models");
const { sendEmail }        = require("../utils/emailSender");
const { generatePassword } = require("../utils/passwordGenerator");
const templates            = require("../utils/emailTemplates");
const { log } = require("../utils/activityLogger");
const { toCode } = require("../utils/deptMap");
const FRONTEND_URL         = process.env.FRONTEND_URL;

const VALID_ROLES = [
  "DOFA", "DOFA_OFFICE", "HOD", "ESTABLISHMENT",
  "LUCS", "ESTATE", "REGISTRAR_OFFICE", "CANDIDATE", "OTHER",
];

const DEPARTMENTS = [
  "Computer Science and Engineering",
  "Electronics and Communication Engineering",
  "Communication and Computer Engineering",
  "Mechanical-Mechatronics Engineering",
  "Physics",
  "Mathematics",
  "Humanities and Social Sciences",
  "Artificial Intelligence and Data Science",
];

/* ══════════════════════════════════════
   REGISTER USER
   DOFA Office registers any portal user.
   System generates password, emails it.
══════════════════════════════════════ */
exports.registerUser = async (req, res) => {
  try {
    const { name, email, role, department, otherRole } = req.body;

    if (!name || !email || !role)
      return res.status(400).json({ message: "Name, email and role are required" });

    if (!VALID_ROLES.includes(role))
      return res.status(400).json({ message: "Invalid role" });

    // Email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: "Invalid email format" });

    // Name cannot contain digits
    if (/\d/.test(name))
      return res.status(400).json({ message: "Name should not contain numbers" });

    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res.status(409).json({ message: "A user with this email already exists" });

    const plainPassword = generatePassword();

    const finalRole       = role === "OTHER" ? (otherRole || "OTHER") : role;
    const finalDepartment = department === "Other"
      ? (req.body.otherDepartment || "Other")
      : department;
    const user = await User.create({
      name, email,
      password:   plainPassword,
      role:       finalRole,
      department: finalDepartment ? toCode(finalDepartment) : null,
      active:     true,
    });

    // Email the new user their credentials
    const loginUrl = `${FRONTEND_URL}/login`;
    await sendEmail(
      email,
      "Welcome to LNMIIT Faculty Recruitment and Onboarding Portal — Your Login Credentials",
      _credentialsEmail({ name, email, password: plainPassword, role: finalRole, loginUrl })
    ).catch(console.error);

    await log({
        user:        req.user,
        action:      "USER_REGISTERED",
        entity:      "USER",
        entityId:    user.id,
        description: `User registered: ${user.id}`,
        req,
        });
    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("registerUser error:", err.message);
    res.status(500).json({ message: "Registration failed" });
  }
};

/* ══════════════════════════════════════
   LIST USERS
══════════════════════════════════════ */
exports.listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "department", "createdAt"],
      order:      [["createdAt", "DESC"]],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

/* ══════════════════════════════════════
   DELETE USER
══════════════════════════════════════ */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await User.destroy({ where: { id: req.params.id } });
    await log({
        user:        req.user,
        action:      "USER_DELETED",
        entity:      "USER",
        entityId:    req.params.id,
        description: `User deleted: ${req.params.id}`,
        req,
        });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err.message);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

/* ══════════════════════════════════════
   FORGOT PASSWORD — send reset link
══════════════════════════════════════ */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ where: { email } });
    // Always respond OK to prevent email enumeration
    if (!user) return res.json({ success: true });

    const { generateResetToken } = require("../utils/passwordGenerator");
    const token  = generateResetToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await User.update(
      { passwordResetToken: token, passwordResetExpiry: expiry },
      { where: { id: user.id } }
    );

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendEmail(
      email,
      "Password Reset Request — LNMIIT Faculty Recruitment Portal",
      _resetEmail({ name: user.name, resetUrl })
    );

    res.json({ success: true });
  } catch (err) {
    console.error("forgotPassword error:", err.message);
    res.status(500).json({ message: "Failed to send reset email" });
  }
};

/* ══════════════════════════════════════
   RESET PASSWORD — verify token and update
══════════════════════════════════════ */
exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword)
      return res.status(400).json({ message: "All fields required" });

    // Password strength
    if (newPassword.length < 8)
      return res.status(400).json({ message: "Minimum 8 characters required" });
    if (!/[A-Z]/.test(newPassword))
      return res.status(400).json({ message: "Must contain an uppercase letter" });
    if (!/[a-z]/.test(newPassword))
      return res.status(400).json({ message: "Must contain a lowercase letter" });
    if (!/[0-9]/.test(newPassword))
      return res.status(400).json({ message: "Must contain a number" });
    if (!/[@#$%!&*]/.test(newPassword))
      return res.status(400).json({ message: "Must contain a special character (@#$%!&*)" });

    const { Op } = require("sequelize");
    const user = await User.findOne({
      where: {
        email,
        passwordResetToken:  token,
        passwordResetExpiry: { [Op.gt]: new Date() },
      },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired reset link. Please request again." });

    const userRecord = await User.findOne({ where: { id: user.id } });
    userRecord.password            = newPassword;   // plain — hook hashes it
    userRecord.passwordResetToken  = null;
    userRecord.passwordResetExpiry = null;
    await userRecord.save();

    await log({
        user:        req.user,
        action:      "PASSWORD_RESET",
        entity:      "USER",
        entityId:    user.id,
        description: `Password reset for user ${user.id}`,
        req,
        });
    res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("resetPassword error:", err.message);
    res.status(500).json({ message: "Reset failed" });
  }
};

/* ── Email HTML helpers ── */
const wrap = (body) => `
<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:30px">
  <div style="background:#8b0000;color:#fff;padding:15px 20px;border-radius:6px 6px 0 0">
    <h2 style="margin:0;font-size:18px">LNMIIT Faculty Recruitment and Onboarding Portal</h2>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px;line-height:1.7;color:#333">
    ${body}
  </div>
  <p style="font-size:11px;color:#aaa;text-align:center;margin-top:12px">
    Do not share your credentials with anyone. Contact DOFA Office for issues.
  </p>
</div>`;

function _credentialsEmail({ name, email, password, role, loginUrl }) {
  return wrap(`
    <p>Dear <strong>${name}</strong>,</p>
    <p>You have been registered on the <strong>LNMIIT Faculty Recruitment and Onboarding Portal</strong> 
    with the role of <strong>${role}</strong>.</p>
    <p>Your login credentials are:</p>
    <table style="border-collapse:collapse;width:100%;margin:15px 0">
      <tr>
        <td style="padding:10px;border:1px solid #ddd;background:#f9f9f9;font-weight:bold;width:40%">Email</td>
        <td style="padding:10px;border:1px solid #ddd">${email}</td>
      </tr>
      <tr>
        <td style="padding:10px;border:1px solid #ddd;background:#f9f9f9;font-weight:bold">Temporary Password</td>
        <td style="padding:10px;border:1px solid #ddd;font-family:monospace;font-size:16px;letter-spacing:2px">
          <strong>${password}</strong>
        </td>
      </tr>
    </table>
    <div style="background:#fff3cd;border:1px solid #ffc107;padding:12px 16px;border-radius:6px;margin:15px 0">
      <p style="margin:0;font-size:13px">
        ⚠ <strong>Important:</strong> Please log in and use "Forgot Password" to change your password immediately.
        Your temporary password will remain active until you change it.
      </p>
    </div>
    <div style="margin:20px 0">
      <a href="${loginUrl}" style="background:#8b0000;color:#fff;padding:10px 24px;border-radius:5px;text-decoration:none;font-weight:bold">
        Login to Portal
      </a>
    </div>
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `);
}

function _resetEmail({ name, resetUrl }) {
  return wrap(`
    <p>Dear <strong>${name}</strong>,</p>
    <p>We received a request to reset your password for the LNMIIT Faculty Recruitment and Onboarding Portal.</p>
    <p>Click the button below to reset your password. This link is valid for <strong>1 hour</strong>.</p>
    <div style="margin:20px 0">
      <a href="${resetUrl}" style="background:#8b0000;color:#fff;padding:10px 24px;border-radius:5px;text-decoration:none;font-weight:bold">
        Reset My Password
      </a>
    </div>
    <p style="color:#888;font-size:13px">
      If you did not request this, please ignore this email. Your password will not change.
    </p>
    <p>Regards,<br><strong>LNMIIT Faculty Recruitment Portal</strong></p>
  `);
}