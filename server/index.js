const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const authRoutes      = require('./routes/auth');
const { router: channelRoutes } = require('./routes/channels');
const messagesRoutes  = require('./routes/messages');
const workspaceRoutes = require('./routes/workspaces');
const setupSocket     = require('./socket');

const app = express();
const server = http.createServer(app);

const codespaceName = process.env.CODESPACE_NAME;
const codespaceDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
const codespaceOrigins = [];

if (codespaceName && codespaceDomain) {
  codespaceOrigins.push(`https://${codespaceName}-5173.${codespaceDomain}`);
  codespaceOrigins.push(`https://${codespaceName}-5174.${codespaceDomain}`);
}

// Build allowed origins list
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://live-chat-app-plum-gamma.vercel.app', // Explicitly add your Vercel URL
  'http://localhost:5173',
  'http://localhost:5174',
  ...codespaceOrigins,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // In production/college project mode, let's be more permissive if origin matches vercel or is null
    if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
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
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messagesRoutes);

// Socket.io
setupSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
