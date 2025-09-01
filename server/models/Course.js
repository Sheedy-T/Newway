const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: [
    {
      mode: {
        type: String,
        required: true,
        enum: ['Online', 'Physical'],
      },
      price: {
        type: Number,
        required: true,
      }
    }
  ],
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true,
  },
  imagePublicId: String, 
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Course', CourseSchema);
