const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Product = require('../models/Product');
const { protect, farmerOnly } = require('../middleware/auth');

// GET /api/stats/farmer  — financial stats for logged-in farmer
router.get('/farmer', protect, farmerOnly, async (req, res) => {
  try {
    const farmerId = req.user._id;

    // All bookings for this farmer, with product info
    const bookings = await Booking.find({ farmer: farmerId })
      .populate('product', 'name price unit category')
      .sort({ createdAt: -1 });

    const confirmed  = bookings.filter(b => b.status === 'confirmed');
    const pending    = bookings.filter(b => b.status === 'pending');
    const rejected   = bookings.filter(b => b.status === 'rejected');

    // Revenue = sum of price * numeric quantity for confirmed bookings
    let totalRevenue = 0;
    confirmed.forEach(b => {
      const price = b.product?.price || 0;
      const qty   = parseFloat(b.quantity) || 1;
      totalRevenue += price * qty;
    });

    // Revenue by category
    const revByCategory = {};
    confirmed.forEach(b => {
      const cat = b.product?.category || 'Other';
      const price = b.product?.price || 0;
      const qty   = parseFloat(b.quantity) || 1;
      revByCategory[cat] = (revByCategory[cat] || 0) + price * qty;
    });

    // Monthly bookings (last 6 months)
    const now = new Date();
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      const year  = d.getFullYear();
      const month = d.getMonth();
      const count = bookings.filter(b => {
        const bd = new Date(b.createdAt);
        return bd.getMonth() === month && bd.getFullYear() === year;
      }).length;
      const rev = confirmed.filter(b => {
        const bd = new Date(b.createdAt);
        return bd.getMonth() === month && bd.getFullYear() === year;
      }).reduce((sum, b) => sum + (b.product?.price || 0) * (parseFloat(b.quantity) || 1), 0);
      monthlyData.push({ label, bookings: count, revenue: Math.round(rev) });
    }

    // Top products by number of bookings
    const productCounts = {};
    bookings.forEach(b => {
      const name = b.product?.name || 'Unknown';
      productCounts[name] = (productCounts[name] || 0) + 1;
    });
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const products = await Product.find({ farmer: farmerId });

    res.json({
      totalBookings:   bookings.length,
      confirmedOrders: confirmed.length,
      pendingOrders:   pending.length,
      rejectedOrders:  rejected.length,
      totalRevenue:    Math.round(totalRevenue),
      totalProducts:   products.length,
      revByCategory,
      monthlyData,
      topProducts,
      recentBookings: bookings.slice(0, 5).map(b => ({
        product:   b.product?.name,
        buyer:     b.buyerName,
        quantity:  b.quantity,
        status:    b.status,
        date:      b.createdAt,
        revenue:   Math.round((b.product?.price || 0) * (parseFloat(b.quantity) || 1)),
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
