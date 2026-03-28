const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    farmer:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyerName:   { type: String, required: true },
    buyerPhone:  { type: String, required: true },
    stars:       { type: Number, required: true, min: 1, max: 5 },
    review:      { type: String, default: '' },
    productName: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rating', ratingSchema);