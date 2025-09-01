const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // Your authentication middleware
const Order = require('../models/Order'); // Your new Order model

// POST: Create a new order
router.post('/', auth, async (req, res) => {
  try {
    const { fullName, email, phoneNumber, shippingAddress, items, subtotal, deliveryAndBankChargeFee, totalAmount, paymentMethod } = req.body;

    // Basic validation (add more as needed)
    if (!shippingAddress || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ message: 'Missing required order details.' });
    }

    const newOrder = new Order({
      userId: req.user.id, // Comes from your authentication middleware
      fullName,
      email,
      phoneNumber,
      shippingAddress,
      items,
      subtotal,
      deliveryAndBankChargeFee,
      totalAmount,
      paymentMethod,
      // You would interact with a payment gateway here for 'card' payments
      // And update status based on gateway response
      status: 'Pending', // Initial status
    });

    await newOrder.save();
    res.status(201).json({ message: 'Order placed successfully', order: newOrder });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error during order placement');
  }
});

// You might add GET routes for admin to view orders or user to view their past orders
// router.get('/', auth, isAdmin, async (req, res) => { ... });
// router.get('/myorders', auth, async (req, res) => { ... });

module.exports = router;