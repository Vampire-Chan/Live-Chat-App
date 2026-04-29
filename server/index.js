const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const authRoutes      = require('./routes/auth');
const { router: channelRoutes } = require('./routes/channels');
const messagesRoutes  = require('./routes/messages');
const setupSocket     = require('./socket');

const app = express();
const server = http.createServer(app);

// Build allowed origins list — always include both 5173 and 5174 as fallbacks
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, same-origin) or matching origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});
app.set('io', io);

app.use(cors(corsOptions));
app.use(express.json());

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messagesRoutes);

// Socket.io
setupSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
