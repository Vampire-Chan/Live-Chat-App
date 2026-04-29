const db = require('./db');
const { fetchMessages } = require('./routes/channels');

// In-memory fallback state
const memoryState = {
  messages: [],
  reactions: [],
  messageIdCounter: 1000
};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Track per-socket metadata for cleanup on disconnect
    socket._meta = { channelId: null, userId: null, username: null };

    // Join channel — history is now loaded via REST, not socket
    socket.on('join_channel', async ({ channelId }) => {
      // Leave any previously joined channel room first
      const prevChannel = socket._meta.channelId;
      if (prevChannel && prevChannel !== channelId) {
        socket.leave(`channel_${prevChannel}`);
      }
      socket.join(`channel_${channelId}`);
      socket._meta.channelId = channelId;
      console.log(`Socket ${socket.id} joined channel_${channelId}`);
      // No channel_history emit — client fetches via GET /api/channels/:id/messages
    });

    // Send message
    socket.on('send_message', async ({ channelId, userId, content, tag, parentId, user }) => {
      try {
        let newMessage;
        try {
          // Insert and get the new message id
          const insertResult = await db.query(
            `INSERT INTO messages (channel_id, user_id, content, tag, parent_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [channelId, userId, content, tag, parentId || null]
          );
          const newId = insertResult.rows[0].id;

          // Fetch the full message with user + reactions (same shape as REST)
          const [fullMsg] = await fetchMessages(channelId, 1, newId + 1);
          newMessage = fullMsg;
        } catch (dbErr) {
          // Fallback to memory when DB is unavailable
          console.warn('DB unavailable, falling back to memory:', dbErr.message);
          newMessage = {
            id: memoryState.messageIdCounter++,
            channel_id: channelId,
            user_id: userId || 1,
            content,
            tag,
            parent_id: parentId || null,
            resolved: false,
            resolution_summary: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            reactions: [],
            user: user || { name: 'Demo User', username: 'Demo User' },
          };
          memoryState.messages.push(newMessage);
        }

        io.to(`channel_${channelId}`).emit('new_message', newMessage);
      } catch (err) {
        console.error('Error sending message:', err);
      }
    });

    // Typing indicators
    socket.on('typing_start', ({ channelId, userId, username }) => {
      // Store so we can clean up on hard disconnect
      socket._meta.channelId = channelId;
      socket._meta.userId = userId;
      socket._meta.username = username;
      socket.to(`channel_${channelId}`).emit('user_typing', { userId, username });
    });

    // FIX: broadcast username (not just userId) so clients can remove by name
    socket.on('typing_stop', ({ channelId, userId, username }) => {
      const name = username || socket._meta.username;
      socket.to(`channel_${channelId}`).emit('user_stopped_typing', { userId, username: name });
      socket._meta.username = null;
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      // Clean up any lingering typing indicator
      const { channelId, userId, username } = socket._meta;
      if (channelId && username) {
        socket.to(`channel_${channelId}`).emit('user_stopped_typing', { userId, username });
      }
    });
  });
};
