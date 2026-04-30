const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { fetchMessages, fetchMessageById } = require('./channels');

const router = express.Router();

const canResolveMessage = async (userId, messageId) => {
  const { rows } = await db.query(
    `SELECT wm.role
     FROM messages m
     JOIN channels c ON c.id = m.channel_id
     JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
     WHERE m.id = $1 AND wm.user_id = $2
     ORDER BY CASE wm.role
       WHEN 'Decision Maker' THEN 3
       WHEN 'Reviewer' THEN 2
       WHEN 'Member' THEN 1
       ELSE 0
     END DESC
     LIMIT 1`,
    [messageId, userId]
  );

  return ['Decision Maker', 'Reviewer'].includes(rows[0]?.role);
};

/* ─── GET /api/messages/:id/replies ──────────────────────── */
router.get('/:id/replies', authMiddleware, async (req, res) => {
  const messageId = parseInt(req.params.id, 10);
  
  if (isNaN(messageId)) {
    return res.status(400).json({ error: 'Invalid message ID' });
  }

  try {
    // First find the channel_id for this message
    const { rows } = await db.query('SELECT channel_id FROM messages WHERE id = $1', [messageId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    const channelId = rows[0].channel_id;

    // Fetch replies (parentId = messageId). Let's say limit 100 for now.
    // fetchMessages returns oldest first (ascending).
    const replies = await fetchMessages(channelId, 100, null, messageId);
    
    return res.json({ replies });
  } catch (err) {
    console.error('Fetch replies error:', err);
    return res.status(500).json({ error: 'Failed to load replies' });
  }
});

/* ─── PATCH /api/messages/:id/resolve ────────────────────── */
router.patch('/:id/resolve', authMiddleware, async (req, res) => {
  const messageId = parseInt(req.params.id, 10);
  const { resolved, resolution_summary } = req.body;

  if (isNaN(messageId)) {
    return res.status(400).json({ error: 'Invalid message ID' });
  }

  try {
    const allowed = await canResolveMessage(req.user.userId || req.user.id, messageId);
    if (!allowed) {
      return res.status(403).json({ error: 'Insufficient permissions to resolve this message' });
    }

    const result = await db.query(
      'UPDATE messages SET resolved = $1, resolution_summary = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING channel_id',
      [resolved, resolution_summary, messageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const channelId = result.rows[0].channel_id;

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`channel_${channelId}`).emit('thread_resolved', {
        messageId,
        summary: resolution_summary,
      });
    }

    // Return the updated full message
    const updatedMsg = await fetchMessageById(messageId);
    return res.json({ message: updatedMsg });

  } catch (err) {
    console.error('Resolve thread error:', err);
    return res.status(500).json({ error: 'Failed to resolve thread' });
  }
});

/* ─── POST /api/messages/:id/reactions ───────────────────── */
router.post('/:id/reactions', authMiddleware, async (req, res) => {
  const messageId = parseInt(req.params.id, 10);
  const { emoji } = req.body;
  const userId = req.user.userId || req.user.id; // normalized in auth middleware

  if (isNaN(messageId) || !emoji) {
    return res.status(400).json({ error: 'Invalid message ID or emoji' });
  }

  try {
    // Check if message exists and get channelId
    const msgCheck = await db.query('SELECT channel_id FROM messages WHERE id = $1', [messageId]);
    if (msgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    const channelId = msgCheck.rows[0].channel_id;

    // Toggle reaction
    const check = await db.query(
      'SELECT id FROM reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, userId, emoji]
    );

    if (check.rows.length > 0) {
      // Exists, delete it
      await db.query('DELETE FROM reactions WHERE id = $1', [check.rows[0].id]);
    } else {
      // Does not exist, insert it
      await db.query(
        'INSERT INTO reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)',
        [messageId, userId, emoji]
      );
    }

    // Fetch updated reactions
    const updatedReactionsResult = await db.query(
      `SELECT
         r.emoji,
         COUNT(*)::int AS count,
         array_agg(r.user_id) AS users,
         array_agg(ru.username) AS usernames
       FROM reactions r
       JOIN users ru ON ru.id = r.user_id
       WHERE r.message_id = $1
       GROUP BY r.emoji`,
      [messageId]
    );

    const updatedReactions = updatedReactionsResult.rows;

    // Emit event
    const io = req.app.get('io');
    if (io) {
      io.to(`channel_${channelId}`).emit('reaction_updated', {
        messageId,
        reactions: updatedReactions,
      });
    }

    return res.json({ reactions: updatedReactions });

  } catch (err) {
    console.error('Toggle reaction error:', err);
    return res.status(500).json({ error: 'Failed to toggle reaction' });
  }
});

module.exports = router;
