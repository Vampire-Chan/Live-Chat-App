const express = require('express');
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
