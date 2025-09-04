const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  userType: { type: String, enum: ['student', 'professional', 'admin'], default: 'student' }
}, { timestamps: true });

// The password hashing logic is now handled in the authRoutes.js file
// during the /verify-otp and /signup steps to avoid double hashing.
// Removing this middleware prevents login failures for new users.

module.exports = mongoose.model('User', userSchema);