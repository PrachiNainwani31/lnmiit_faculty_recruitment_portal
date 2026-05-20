const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Mailer config error:", error.message);
  } else {
    console.log("Mailer ready ✓ | user:", process.env.EMAIL_USER);
  }
});

module.exports = transporter;
