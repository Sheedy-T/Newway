const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const User = require('../models/User');
const OTPModel = require('../models/OTP');
const sendOTP = require('../utils/sendEmail');

// ========================================
// ✅ Check Email Availability
// ========================================
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    res.json({ exists: !!user });
  } catch (err) {
    console.error('Error checking email:', err);
    res.status(500).json({ error: 'Server error while checking email' });
  }
});

// ========================================
// ✅ Signup (OTP Generation & Email)
// ========================================
router.post('/signup', async (req, res) => {
  try {
    let { fullName, email, password, phone, userType } = req.body;
    email = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { phone: phone.trim() }
      ]
    });

    if (existingUser) {
      const error = existingUser.email.toLowerCase() === email
        ? 'Email already in use'
        : 'Phone number already registered';
      return res.status(400).json({ error });
    }

    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    await OTPModel.create({ email, otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    await sendOTP(email, otp);

    res.json({ success: true, message: 'OTP sent to your email. Please verify.', email });
  } catch (err) {
    console.error('Signup OTP Error:', err);
    res.status(500).json({ error: 'Signup error', details: err.message });
  }
});

// ========================================
// ✅ Verify OTP and Complete Registration
// ========================================
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, fullName, password, phone, userType } = req.body;
    const otpEntry = await OTPModel.findOne({ email, otp });

    if (!otpEntry || otpEntry.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    await OTPModel.deleteOne({ _id: otpEntry._id });

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      userType
    });
    await user.save();

    res.status(201).json({ success: true, message: 'Account created successfully' });
  } catch (err) {
    console.error('OTP Verification Error:', err);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// ========================================
// ✅ Login — using HTTP-only cookie
// ========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.userType },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    // ✅ Cross-site cookie setup
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",   // IMPORTANT for Netlify + Render
      maxAge: 24 * 60 * 60 * 1000,
    });

    user.password = undefined;

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.userType,
      },
      message: 'Login successful',
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// ========================================
// ✅ Logout — clear the cookie (cross-site safe)
// ========================================
router.post('/logout', (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// ========================================
// ✅ /me — return logged-in user if valid cookie
// ========================================
const { auth } = require('../middleware/auth');

router.get('/me', auth, async (req, res) => {
  try {
    const user = req.user; // already populated in middleware
    res.json({ success: true, user });
  } catch (err) {
    console.error("Error in /me:", err);
    res.status(500).json({ error: "Server error" });
  }
});
