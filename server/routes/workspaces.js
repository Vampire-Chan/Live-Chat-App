const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const {
  ensureDefaultWorkspaceForUser,
  getUserWorkspaces,
  getWorkspaceChannels,
  getWorkspaceMembers,
} = require('../services/workspaces');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    await ensureDefaultWorkspaceForUser(req.user.userId);
    const workspaces = await getUserWorkspaces(req.user.userId);
    return res.json({ workspaces });
  } catch (err) {
    console.error('Fetch workspaces error:', err);
    return res.status(500).json({ error: 'Failed to load workspaces' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

  try {
    const slugBase = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { rows } = await db.query(
      'INSERT INTO workspaces (name, slug) VALUES ($1, $2) RETURNING id, name, slug',
      [name.trim(), `${slugBase}-${Date.now().toString().slice(-4)}`]
    );

    const workspace = rows[0];
    await db.query(
      'INSERT INTO workspace_members (user_id, workspace_id, role) VALUES ($1, $2, $3)',
      [req.user.userId, workspace.id, 'Decision Maker']
    );

    // Create default #general channel
    const chanInsert = await db.query(
      'INSERT INTO channels (workspace_id, name, description) VALUES ($1, $2, $3) RETURNING id, name, description',
      [workspace.id, 'general', 'General discussion']
    );

    return res.status(201).json({ ...workspace, channels: [chanInsert.rows[0]] });
  } catch (err) {
    console.error('Create workspace error:', err);
    return res.status(500).json({ error: 'Failed to create workspace' });
  }
});

router.get('/:workspaceId/channels', authMiddleware, async (req, res) => {
  const workspaceId = parseInt(req.params.workspaceId, 10);
  if (isNaN(workspaceId)) {
    return res.status(400).json({ error: 'Invalid workspace ID' });
  }

  try {
    const channels = await getWorkspaceChannels(req.user.userId, workspaceId);
    if (!channels) {
      return res.status(403).json({ error: 'Access denied' });
    }
    return res.json({ channels });
  } catch (err) {
    console.error('Fetch channels error:', err);
    return res.status(500).json({ error: 'Failed to load channels' });
  }
});

router.post('/:workspaceId/channels', authMiddleware, async (req, res) => {
  const workspaceId = parseInt(req.params.workspaceId, 10);
  const { name, description } = req.body;

  if (isNaN(workspaceId) || !name?.trim()) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  try {
    const { rows } = await db.query(
      'INSERT INTO channels (workspace_id, name, description) VALUES ($1, $2, $3) RETURNING id, name, description',
      [workspaceId, name.trim().toLowerCase().replace(/\s+/g, '-'), description]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create channel error:', err);
    return res.status(500).json({ error: 'Failed to create channel' });
  }
});

router.get('/:workspaceId/members', authMiddleware, async (req, res) => {
  const workspaceId = parseInt(req.params.workspaceId, 10);
  if (isNaN(workspaceId)) {
    return res.status(400).json({ error: 'Invalid workspace ID' });
  }

  try {
    const members = await getWorkspaceMembers(req.user.userId, workspaceId);
    if (!members) {
      return res.status(403).json({ error: 'Access denied' });
    }
    return res.json({ members });
  } catch (err) {
    console.error('Fetch members error:', err);
    return res.status(500).json({ error: 'Failed to load members' });
  }
});

module.exports = router;
