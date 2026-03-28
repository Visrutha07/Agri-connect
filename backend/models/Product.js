const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    farmer:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmerName:  { type: String, required: true },
    farmerPhone: { type: String, required: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price:       { type: Number, required: true },
    unit:        { type: String, required: true },
    quantity:    { type: String, default: '' },
    stock:       { type: Number, default: null },   // numeric stock, decrements on confirmed booking
    image:       { type: String, default: '' },
    category:    { type: String, default: 'Other' },
    isAvailable: { type: Boolean, default: true },
    farmerCity:  { type: String, default: '' },
    farmerLat:   { type: Number, default: null },
    farmerLng:   { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
