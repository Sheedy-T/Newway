// routes/bookings.js
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const { auth, adminOnly } = require("../middleware/auth");
const sendCustomEmail = require("../utils/sendCustomEmail");

// Create a new booking (for both courses and products)
router.post("/", auth, async (req, res) => {
  try {
    const {
      items,
      fullName,
      email,
      phoneNumber,
      shippingAddress,
      paymentMethod,
      subtotal,
      deliveryAndBankChargeFee,
      totalAmount,
      bookingType // 'course' or 'product'
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    const newBooking = new Booking({
      user: req.user._id,
      items: items.map(item => ({
        ...item,
        
        itemModel: bookingType === 'course' ? 'Course' : 'Product'
      })),
      fullName,
      email,
      phoneNumber,
      shippingAddress,
      paymentMethod,
      subtotal,
      deliveryAndBankChargeFee,
      totalAmount,
      // Set initial status based on booking type
      status: bookingType === 'course' ? "Awaiting Schedule" : "Pending"
    });

    await newBooking.save();

    // Do NOT send email here. It will be sent after payment verification.

    res.status(201).json({ success: true, booking: newBooking });
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ message: "Server error creating booking" });
  }
});

// Get all bookings (admin only)
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find().populate("user", "name email").populate("items.itemId");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// Get current user's bookings
router.get("/my", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate("items.itemId");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your bookings" });
  }
});

// Update booking status (admin only)
router.put("/:id/status", auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }


    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: "Failed to update booking status" });
  }
});

// Delete booking (admin only)
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Booking deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete booking" });
  }
});

module.exports = router;