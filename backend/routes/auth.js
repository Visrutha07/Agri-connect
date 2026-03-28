const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, role, location, city } = req.body;

    if (!name || !phone || !password || !role) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const exists = await User.findOne({ phone });
    if (exists) return res.status(400).json({ message: 'Phone number already registered' });

    const user = await User.create({ name, phone, password, role, location, city: city || location || '' });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      location: user.location,
      city: user.city,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) return res.status(401).json({ message: 'Invalid phone or password' });

    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid phone or password' });

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      location: user.location,
      city: user.city,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
