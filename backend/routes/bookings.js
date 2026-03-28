const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Product = require('../models/Product');
const { protect, farmerOnly } = require('../middleware/auth');

// POST /api/bookings  — customer books a product
router.post('/', async (req, res) => {
  try {
    const { productId, buyerName, buyerPhone, quantity, message } = req.body;

    if (!productId || !buyerName || !buyerPhone || !quantity) {
      return res.status(400).json({ message: 'Please fill in all booking fields' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Check stock availability
    if (product.stock !== null && product.stock !== undefined) {
      const ordered = parseFloat(quantity);
      if (ordered > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} ${product.unit} available` });
      }
      if (product.stock === 0) {
        return res.status(400).json({ message: 'This product is out of stock' });
      }
    }

    const booking = await Booking.create({
      product:    productId,
      farmer:     product.farmer,
      buyerName,
      buyerPhone,
      quantity,
      message: message || '',
    });

    await booking.populate('product', 'name price unit image farmerName');
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/farmer  — farmer sees all bookings for their products
router.get('/farmer', protect, farmerOnly, async (req, res) => {
  try {
    const bookings = await Booking.find({ farmer: req.user._id })
      .populate('product', 'name price unit image')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/customer/:phone  — customer checks their orders by phone
router.get('/customer/:phone', async (req, res) => {
  try {
    const bookings = await Booking.find({ buyerPhone: req.params.phone })
      .populate('product', 'name price unit image farmerName farmerPhone farmer')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/bookings/:id/status  — farmer confirms or rejects
router.patch('/:id/status', protect, farmerOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = status;
    await booking.save();

    // Deduct stock when farmer confirms the booking
    if (status === 'confirmed') {
      const product = await Product.findById(booking.product);
      if (product && product.stock !== null && product.stock !== undefined) {
        const ordered = parseFloat(booking.quantity) || 0;
        product.stock = Math.max(0, product.stock - ordered);
        await product.save();
      }
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
