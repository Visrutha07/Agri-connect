const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Booking = require('../models/Booking');
const { protect, farmerOnly } = require('../middleware/auth');

// POST /api/ratings  — customer submits a rating
router.post('/', async (req, res) => {
  try {
    const { farmerId, buyerName, buyerPhone, stars, review, productName } = req.body;
    if (!farmerId || !buyerName || !buyerPhone || !stars) {
      return res.status(400).json({ message: 'All fields required' });
    }

    // Only allow rating after a confirmed booking
    const booking = await Booking.findOne({ farmer: farmerId, buyerPhone, status: 'confirmed' });
    if (!booking) {
      return res.status(403).json({ message: 'You can only rate after a confirmed booking' });
    }

    // Prevent duplicate rating
    const existing = await Rating.findOne({ farmer: farmerId, buyerPhone });
    if (existing) {
      return res.status(400).json({ message: 'You have already rated this farmer' });
    }

    const rating = await Rating.create({ farmer: farmerId, buyerName, buyerPhone, stars, review, productName });
    res.status(201).json(rating);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ratings/mine  — farmer sees their own ratings
router.get('/mine', protect, farmerOnly, async (req, res) => {
  try {
    const ratings = await Rating.find({ farmer: req.user._id }).sort({ createdAt: -1 });
    const avg = ratings.length
      ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)
      : null;
    res.json({ ratings, average: avg, total: ratings.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ratings/:farmerId  — get ratings for a specific farmer (public)
router.get('/:farmerId', async (req, res) => {
  try {
    const ratings = await Rating.find({ farmer: req.params.farmerId }).sort({ createdAt: -1 });
    const avg = ratings.length
      ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)
      : null;
    res.json({ ratings, average: avg, total: ratings.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;