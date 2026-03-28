const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// ── Middleware ──
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static folder for uploaded images ──
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/posts',    require('./routes/posts'));
app.use('/api/chat',     require('./routes/chat'));
app.use('/api/stats',    require('./routes/stats'));
app.use('/api/farmers',  require('./routes/farmers'));
app.use('/api/ratings', require('./routes/ratings'));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'FarmConnect API is running 🌾' });
});

// ── Connect to MongoDB and start server ──
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT, () => {
      console.log(`✅ Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
