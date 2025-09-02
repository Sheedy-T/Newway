// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

// ✅ Utilities
const listAllRoutes = require('./utils/listAllRoutes');

// ✅ API Routes
const courseRoutes = require('./routes/courses');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const profileRoutes = require('./routes/profile');
const paystackRoutes = require('./routes/paystack');
const authRoutes = require('./routes/authRoutes');
const bookingsRoute = require('./routes/bookings');

// ✅ Live Meeting (rooms store + router)
const liveRoomsRouter = require('./routes/liveRooms'); // A function that returns a router
const signaling = require('./utils/signaling');
const setupSFU = require('./utils/mediasoup');

const app = express();

// In-memory room state (shared between REST and Socket.IO)
const rooms = {};

// ---------- Middleware ----------
app.use(cors({
  origin: [
    'https://jbmtechservice.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4040',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- API ----------
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/bookings', bookingsRoute);

// Live rooms REST endpoints (create/list). The shared `rooms` object is passed here.
app.use('/api/live-rooms', liveRoomsRouter(rooms)); // Pass the rooms object to the router function

// ---------- DB ----------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ---------- HTTP + Socket.IO ----------
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'https://jbmtechservice.netlify.app',
    ],
    methods: ['GET', 'POST', "OPTIONS"],
    credentials: true,
  },
});

// Attach mesh signaling with the SAME rooms store
signaling(io, rooms);

// Attach SFU (mediasoup) signaling (shares the same Socket.IO instance)
setupSFU(io, rooms);

// ---------- Start ----------
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  listAllRoutes(app);
});

// ---------- Safety ----------
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});