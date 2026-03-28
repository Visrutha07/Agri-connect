const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    farmer:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // optional if not logged in
    buyerName:   { type: String, required: true },
    buyerPhone:  { type: String, required: true },
    quantity:    { type: String, required: true },
    message:     { type: String, default: '' },
    status:      { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
