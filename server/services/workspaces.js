const db = require('../db');

const DEFAULT_WORKSPACE = {
  name: 'Koru Workspace',
  slug: 'koru-workspace',
};

const DEFAULT_CHANNELS = [
  { name: 'general', description: 'Team-wide announcements and discussion' },
  { name: 'engineering', description: 'Builds, releases, and technical updates' },
  { name: 'design', description: 'UX, UI, and visual direction' },
  { name: 'decisions', description: 'Key decisions and approvals' },
];

const ensureDefaultWorkspace = async () => {
  const { rows } = await db.query(
    'SELECT id, name, slug FROM workspaces WHERE slug = $1 LIMIT 1',
    [DEFAULT_WORKSPACE.slug]
  );

  if (rows.length > 0) return rows[0];

  const insert = await db.query(
    'INSERT INTO workspaces (name, slug) VALUES ($1, $2) RETURNING id, name, slug',
    [DEFAULT_WORKSPACE.name, DEFAULT_WORKSPACE.slug]
  );

  return insert.rows[0];
};

const ensureDefaultChannels = async (workspaceId) => {
  const { rows } = await db.query(
    'SELECT COUNT(*)::int AS count FROM channels WHERE workspace_id = $1',
    [workspaceId]
  );

  if (rows[0]?.count > 0) return;

  for (const channel of DEFAULT_CHANNELS) {
    await db.query(
      'INSERT INTO channels (workspace_id, name, description) VALUES ($1, $2, $3)',
      [workspaceId, channel.name, channel.description]
    );
  }
};

const ensureWorkspaceMembership = async (userId, workspaceId) => {
  const existing = await db.query(
    'SELECT id FROM workspace_members WHERE user_id = $1 AND workspace_id = $2 LIMIT 1',
    [userId, workspaceId]
  );

  if (existing.rows.length > 0) return;

  const { rows } = await db.query(
    'SELECT COUNT(*)::int AS count FROM workspace_members WHERE workspace_id = $1',
    [workspaceId]
  );
  const role = rows[0]?.count === 0 ? 'Decision Maker' : 'Member';

  await db.query(
    'INSERT INTO workspace_members (user_id, workspace_id, role) VALUES ($1, $2, $3)',
    [userId, workspaceId, role]
  );
};

const ensureDefaultWorkspaceForUser = async (userId) => {
  const workspace = await ensureDefaultWorkspace();
  await ensureDefaultChannels(workspace.id);
  await ensureWorkspaceMembership(userId, workspace.id);
  return workspace;
};

const getUserWorkspaces = async (userId) => {
  const { rows } = await db.query(
    `SELECT
        w.id,
        w.name,
        w.slug,
        wm.role,
        (SELECT COUNT(*)::int FROM workspace_members wm2 WHERE wm2.workspace_id = w.id) AS member_count,
        (SELECT COUNT(*)::int FROM channels c WHERE c.workspace_id = w.id) AS channel_count
     FROM workspaces w
     JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE wm.user_id = $1
     ORDER BY w.created_at ASC`,
    [userId]
  );

  return rows;
};

const isWorkspaceMember = async (userId, workspaceId) => {
  const { rows } = await db.query(
    'SELECT 1 FROM workspace_members WHERE user_id = $1 AND workspace_id = $2',
    [userId, workspaceId]
  );
  return rows.length > 0;
};

const getWorkspaceChannels = async (userId, workspaceId) => {
  const isMember = await isWorkspaceMember(userId, workspaceId);
  if (!isMember) return null;

  const { rows } = await db.query(
    `SELECT id, name, description
     FROM channels
     WHERE workspace_id = $1
     ORDER BY id ASC`,
    [workspaceId]
  );

  return rows;
};

const getWorkspaceMembers = async (userId, workspaceId) => {
  const isMember = await isWorkspaceMember(userId, workspaceId);
  if (!isMember) return null;

  const { rows } = await db.query(
    `SELECT
        u.id,
        u.username AS name,
        u.username,
        u.avatar_url,
        wm.role
     FROM workspace_members wm
     JOIN users u ON u.id = wm.user_id
     WHERE wm.workspace_id = $1
     ORDER BY u.username ASC`,
    [workspaceId]
  );

  return rows;
};

module.exports = {
  ensureDefaultWorkspaceForUser,
  getUserWorkspaces,
  getWorkspaceChannels,
  getWorkspaceMembers,
};
