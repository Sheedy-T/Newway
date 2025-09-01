// server/routes/products.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// ✅ Get all products (with optional search + category filter)
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;

    let query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" }; // case-insensitive
    }
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all featured products (auto filter)
router.get("/featured", async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true }).sort({
      createdAt: -1,
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all promoted products (auto-expiry check)
router.get("/promoted", async (req, res) => {
  try {
    const now = new Date();
    const products = await Product.find({
      isPromoted: true,
      $or: [
        { promoExpiresAt: null }, // no expiry
        { promoExpiresAt: { $gte: now } }, // still valid
      ],
    }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Create new product
router.post("/", async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Update product
router.put("/:id", async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProduct)
      return res.status(404).json({ error: "Product not found" });
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Delete product
router.delete("/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct)
      return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
