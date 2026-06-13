const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
// remove4

exports.sendEmail = async (to, subject, html) => {
  try {
    // await transporter.sendMail({ remove5
    await resend.emails.send({
      from: `"LNMIIT Recruitment" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Email failed:", to, err.message);
  }
};
