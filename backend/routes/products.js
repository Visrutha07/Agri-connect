const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, farmerOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/products  — all available products (public)
router.get('/', async (req, res) => {
  try {
    const User = require('../models/User');
    const { search, category, city } = req.query;
    const query = { isAvailable: true };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category && category !== 'All') query.category = category;

    if (city) {
      const matchingFarmers = await User.find({
        role: 'farmer',
        location: { $regex: city, $options: 'i' },
      }).select('_id');
      query.farmer = { $in: matchingFarmers.map(f => f._id) };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/mine  — farmer's own products
router.get('/mine', protect, farmerOnly, async (req, res) => {
  try {
    const products = await Product.find({ farmer: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products  — create product (farmer only)
router.post('/', protect, farmerOnly, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, unit, quantity, category, stock } = req.body;

    if (!name || !price || !unit) {
      return res.status(400).json({ message: 'Name, price, and unit are required' });
    }

    const product = await Product.create({
      stock: stock ? Number(stock) : null,
      farmer:      req.user._id,
      farmerName:  req.user.name,
      farmerPhone: req.user.phone,
      farmerCity:  req.user.city || req.user.location || '',
      farmerLat:   req.user.latitude || null,
      farmerLng:   req.user.longitude || null,
      name,
      description,
      price:    Number(price),
      unit,
      quantity,
      category: category || 'Other',
      image:    req.file ? req.file.filename : '',
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/products/:id  — farmer removes own product
router.delete('/:id', protect, farmerOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your product' });
    }
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// TEMP DEBUG — remove after fixing
router.get('/debug-city', async (req, res) => {
  try {
    const User = require('../models/User');
    const farmers = await User.find({ role: 'farmer' }, 'name location city');
    const products = await Product.find({}, 'name farmer farmerName farmerCity').limit(10);
    res.json({ farmers, products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
