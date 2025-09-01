const nodemailer = require("nodemailer");
require("dotenv").config();

const sendCustomEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER, // Gmail
        pass: process.env.EMAIL_PASS  // App Password
      }
    });

    await transporter.sendMail({
      from: `"JBM TECH" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log(`✅ Email sent to ${to} - Subject: ${subject}`);
  } catch (error) {
    console.error("❌ Error sending custom email:", error);
    throw error;
  }
};

module.exports = sendCustomEmail;
