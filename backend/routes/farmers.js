const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/farmers/cities  — unique cities where farmers are registered
// GET /api/farmers/cities  — unique cities where farmers are registered
router.get('/cities', async (req, res) => {
  try {
    const farmers = await User.find({ role: 'farmer' }, 'location');
    const cities = [...new Set(farmers.map(f => f.location).filter(Boolean))].sort();
    res.json(cities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/farmers/location  — farmer updates their city/location
router.patch('/location', protect, async (req, res) => {
  try {
    const { city, latitude, longitude } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (city !== undefined)      user.city      = city;
    if (latitude !== undefined)  user.latitude  = latitude;
    if (longitude !== undefined) user.longitude = longitude;
    await user.save();
    res.json({ city: user.city, latitude: user.latitude, longitude: user.longitude });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
