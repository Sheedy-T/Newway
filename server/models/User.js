const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, // Ensures email uniqueness
    lowercase: true,
    trim: true,
    validate: {
  validator:function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      }
    }
  },
  
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  userType: { type: String, enum: ['student', 'professional','admin'], default: 'student' }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  // Only hash if password is modified (or new user)
  if (!this.isModified('password')) return next();
  
  try {
    
     const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    console.error('Error hashing password:', err);
    next(err);
  }
});


module.exports = mongoose.model('User', userSchema);