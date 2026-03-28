const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ['farmer', 'customer'], required: true },
    room:       { type: String, required: true },  // 'general' or 'farmer-chat'
    text:       { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
