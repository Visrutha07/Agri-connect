const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// GET /api/chat/:room  — load recent messages for a room
router.get('/:room', protect, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat/:room  — send a message
router.post('/:room', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    const message = await Message.create({
      sender:     req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      room:       req.params.room,
      text:       text.trim(),
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
