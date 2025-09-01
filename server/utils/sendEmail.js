const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter using Gmail SMTP with App Password
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASS  // App password (16-digit code from Google)
  }
});

// Function to send OTP via email
const sendOTP = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};


if (require.main === module) {
  const testEmail = process.env.EMAIL_USER;  // Send test to your own Gmail
  const testOTP = Math.floor(100000 + Math.random() * 900000); 
  console.log(`Sending OTP ${testOTP} to ${testEmail}`);

  sendOTP(testEmail, testOTP)
    .then(() => console.log('Test OTP email sent successfully!'))
    .catch(err => console.error('Test OTP sending failed:', err));
}

module.exports = sendOTP;
