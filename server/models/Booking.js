// models/Booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          // Use 'refPath' to dynamically reference either 'Course' or 'Product'
          refPath: 'items.itemModel'
        },
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 },
        itemModel: {
          type: String,
          required: true,
          enum: ['Course', 'Product']
        }
      }
    ],
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    shippingAddress: { type: String }, // For products
    paymentMethod: { type: String, enum: ["card", "bank"], default: "card" },
    status: { 
      type: String, 
      enum: ["Pending", "Awaiting Schedule", "Paid", "Processing", "Completed", "Shipped"], 
      default: "Pending" 
    },
    subtotal: { type: Number, required: true },
    deliveryAndBankChargeFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paystackReference: { type: String },
    paystackData: { type: Object }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);