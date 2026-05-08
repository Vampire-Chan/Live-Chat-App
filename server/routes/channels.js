const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * Shared query that fetches messages with user info and reactions.
 * Supports cursor-based pagination via `before` (message id) or offset.
 *
 * @param {number} channelId
 * @param {number} limit - max messages to return
 * @param {number|null} beforeId - fetch messages with id < beforeId (for infinite scroll)
 * @param {number|null} parentId - if provided, fetch replies to this parent. If null, fetch top-level messages.
 */
const fetchMessages = async (channelId, limit = 50, beforeId = null, parentId = null) => {
  const params = [channelId, limit];
  const beforeClause = beforeId ? `AND m.id < $${params.push(beforeId)}` : '';
  const parentClause = parentId ? `AND m.parent_id = $${params.push(parentId)}` : 'AND m.parent_id IS NULL';

  const { rows } = await db.query(
    `SELECT
        m.id,
        m.channel_id,
        m.user_id,
        m.content,
        m.tag,
        m.parent_id,
        m.resolved,
        m.resolution_summary,
        m.created_at,
        m.updated_at,
        json_build_object(
          'id',         u.id,
          'name',       u.username,
          'username',   u.username,
          'avatar_url', u.avatar_url
        ) AS "user",
        COALESCE(
          json_agg(
            json_build_object('emoji', r.emoji, 'count', r.cnt, 'users', r.users, 'usernames', r.usernames)
          ) FILTER (WHERE r.emoji IS NOT NULL),
          '[]'
        ) AS reactions,
        (SELECT COUNT(*)::int FROM messages replies WHERE replies.parent_id = m.id) AS reply_count
     FROM messages m
     JOIN users u ON u.id = m.user_id
     LEFT JOIN (
       SELECT
         r.message_id,
         r.emoji,
         COUNT(*)::int AS cnt,
         array_agg(r.user_id) AS users,
         array_agg(ru.username) AS usernames
       FROM reactions r
       JOIN users ru ON ru.id = r.user_id
       GROUP BY r.message_id, r.emoji
     ) r ON r.message_id = m.id
     WHERE m.channel_id = $1
       ${beforeClause}
       ${parentClause}
     GROUP BY m.id, u.id
     ORDER BY m.created_at DESC
     LIMIT $2`,
    params
  );

  // Return in ascending order (oldest first) — we queried DESC for the cursor
  return rows.reverse();
};

/* ─── DELETE /api/channels/:channelId ────────────────────── */
router.delete('/:channelId', authMiddleware, async (req, res) => {
  const channelId = parseInt(req.params.channelId, 10);
  if (isNaN(channelId)) return res.status(400).json({ error: 'Invalid ID' });

  try {
    await db.query('DELETE FROM channels WHERE id = $1', [channelId]);
    return res.status(204).send();
  } catch (err) {
    console.error('Delete channel error:', err);
    return res.status(500).json({ error: 'Failed to delete' });
  }
});

const fetchMessageById = async (id) => {
  const { rows } = await db.query(
    `SELECT
        m.id,
        m.channel_id,
        m.user_id,
        m.content,
        m.tag,
        m.parent_id,
        m.resolved,
        m.resolution_summary,
        m.created_at,
        m.updated_at,
        json_build_object(
          'id',         u.id,
          'name',       u.username,
          'username',   u.username,
          'avatar_url', u.avatar_url
        ) AS "user",
        COALESCE(
          json_agg(
            json_build_object('emoji', r.emoji, 'count', r.cnt, 'users', r.users, 'usernames', r.usernames)
          ) FILTER (WHERE r.emoji IS NOT NULL),
          '[]'
        ) AS reactions,
        (SELECT COUNT(*)::int FROM messages replies WHERE replies.parent_id = m.id) AS reply_count
     FROM messages m
     JOIN users u ON u.id = m.user_id
     LEFT JOIN (
       SELECT
         r.message_id,
         r.emoji,
         COUNT(*)::int AS cnt,
         array_agg(r.user_id) AS users,
         array_agg(ru.username) AS usernames
       FROM reactions r
       JOIN users ru ON ru.id = r.user_id
       GROUP BY r.message_id, r.emoji
     ) r ON r.message_id = m.id
     WHERE m.id = $1
     GROUP BY m.id, u.id`,
    [id]
  );
  return rows[0];
};

/* ─── GET /api/channels/:channelId/messages ──────────────── */
// Protected: requires valid JWT
router.get('/:channelId/messages', authMiddleware, async (req, res) => {
  const channelId = parseInt(req.params.channelId, 10);
  const limit     = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const beforeId  = req.query.before ? parseInt(req.query.before, 10) : null;

  if (isNaN(channelId)) {
    return res.status(400).json({ error: 'Invalid channel ID' });
  }

  try {
    const messages = await fetchMessages(channelId, limit, beforeId, null);
    return res.json({
      messages,
      hasMore: messages.length === limit,
    });
  } catch (err) {
    console.error('Fetch messages error:', err);
    return res.status(500).json({ error: 'Failed to load messages' });
  }
});

module.exports = { router, fetchMessages, fetchMessageById };
