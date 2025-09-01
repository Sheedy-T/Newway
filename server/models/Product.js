const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  size: { type: String },
  description: { type: String },

  // ✅ Legacy field (multer uploads)
  image: { type: String },

  // ✅ New field (Cloudinary uploads)
  imageUrl: { type: String },

  isFeatured: {
    type: Boolean,
    default: false,
  },
  isPromoted: {
    type: Boolean,
    default: false,
  },
  promoExpiresAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
