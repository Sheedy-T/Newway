// server/models/Order.js

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
}, { _id: false }); 

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  shippingAddress: {
    type: String,
    required: true,
  },
  items: [orderItemSchema], // Array of order items
  subtotal: {
    type: Number,
    required: true,
  },
  deliveryAndBankChargeFee: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bankTransfer', 'cashOnDelivery'], // Adjust as needed
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Paid', 'Shipped', 'Delivered', 'Cancelled', 'Failed'],
    default: 'Pending',
  },
  paystackReference: { // Store Paystack transaction reference
    type: String,
    sparse: true, 
  },
  paystackData: { 
    type: Object,
    default: {},
  },
}, { timestamps: true }); 

module.exports = mongoose.model('Order', orderSchema);
