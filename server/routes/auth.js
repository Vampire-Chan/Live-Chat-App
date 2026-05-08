const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { ensureDefaultWorkspaceForUser } = require('../services/workspaces');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const SALT_ROUNDS = 10;

const ROLE_PRIORITY = {
  'Decision Maker': 3,
  Reviewer: 2,
  Member: 1,
  Observer: 0,
};

/* ─── Helpers ─────────────────────────────────────────────── */

/** Strip password_hash and return a safe user object */
const safeUser = (row, role = 'Member') => {
  const { password_hash, ...user } = row;
  user.role = role;
  return user;
};

/** Build and sign a 7-day JWT */
const signToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

const getUserRole = async (userId) => {
  const { rows } = await db.query(
    `SELECT role
     FROM workspace_members
     WHERE user_id = $1
     ORDER BY CASE role
       WHEN 'Decision Maker' THEN 3
       WHEN 'Reviewer' THEN 2
       WHEN 'Member' THEN 1
       ELSE 0
     END DESC
     LIMIT 1`,
    [userId]
  );

  return rows[0]?.role || 'Member';
};

/* ─── POST /api/auth/register ─────────────────────────────── */
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body ?? {};

  // ── Input validation ──────────────────────────────────────
  const errors = {};
  if (!username || String(username).trim().length < 2)
    errors.username = 'Username must be at least 2 characters';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim()))
    errors.email = 'A valid email address is required';
  if (!password || String(password).length < 6)
    errors.password = 'Password must be at least 6 characters';

  if (Object.keys(errors).length > 0)
    return res.status(400).json({ error: 'Validation failed', fields: errors });

  try {
    // ── Duplicate check (explicit query, not just constraint error) ──
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1',
      [email.trim().toLowerCase(), username.trim()]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Username or email already exists' });

    // ── Hash + insert ──────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, avatar_url, created_at`,
      [username.trim(), email.trim().toLowerCase(), passwordHash]
    );

    await ensureDefaultWorkspaceForUser(result.rows[0].id);

    const role  = await getUserRole(result.rows[0].id);
    const user  = safeUser(result.rows[0], role);
    const token = signToken(user.id);

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    // pg unique violation fallback
    if (err.code === '23505')
      return res.status(409).json({ error: 'Username or email already exists' });
    
    // DEBUG: Return actual error message to help identify the 500 cause
    return res.status(500).json({ 
      error: 'Server error', 
      details: err.message,
      code: err.code
    });
  }
});

/* ─── POST /api/auth/login ────────────────────────────────── */
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  // ── Input validation ──────────────────────────────────────
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [String(email).trim().toLowerCase()]
    );

    // Same generic message for both "not found" and "wrong password"
    // to prevent user-enumeration attacks
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(String(password), user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await ensureDefaultWorkspaceForUser(user.id);

    const role = await getUserRole(user.id);
    const token = signToken(user.id);

    return res.json({ user: safeUser(user, role), token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ 
      error: 'Server error', 
      details: err.message,
      code: err.code 
    });
  }
});

/* ─── GET /api/auth/me  (protected) ──────────────────────── */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found' });

    await ensureDefaultWorkspaceForUser(req.user.userId);
    const role = await getUserRole(req.user.userId);
    return res.json({ user: safeUser(result.rows[0], role) });
  } catch (err) {
    console.error('/me error:', err);
    return res.status(500).json({ 
      error: 'Server error', 
      details: err.message,
      code: err.code 
    });
  }
});

/* ─── PATCH /api/auth/profile (protected) ────────────────── */
router.patch('/profile', authMiddleware, async (req, res) => {
  const { username, avatar_url } = req.body;
  
  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (username?.trim()) {
      fields.push(`username = $${idx++}`);
      values.push(username.trim());
    }
    if (avatar_url !== undefined) {
      fields.push(`avatar_url = $${idx++}`);
      values.push(avatar_url);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.userId);
    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, username, email, avatar_url, created_at`,
      values
    );

    const role = await getUserRole(req.user.userId);
    return res.json({ user: safeUser(result.rows[0], role) });
  } catch (err) {
    console.error('Update profile error:', err);
    if (err.code === '23505') return res.status(409).json({ error: 'Username already taken' });
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
