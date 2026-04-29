const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const SALT_ROUNDS = 10;

/* ─── Helpers ─────────────────────────────────────────────── */

/** Strip password_hash and return a safe user object */
const safeUser = (row) => {
  const { password_hash, ...user } = row;
  user.role = 'Decision Maker'; // Allow all registered users to test Resolve
  return user;
};

/** Build and sign a 7-day JWT */
const signToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

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

    const user  = safeUser(result.rows[0]);
    const token = signToken(user.id);

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    // pg unique violation fallback
    if (err.code === '23505')
      return res.status(409).json({ error: 'Username or email already exists' });
    return res.status(500).json({ error: 'Server error — please try again' });
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

    const token = signToken(user.id);
    return res.json({ user: safeUser(user), token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error — please try again' });
  }
});

/* ─── GET /api/auth/me  (protected) ──────────────────────── */
router.get('/me', authMiddleware, async (req, res) => {
  if (req.user.isDemo) {
    return res.json({ user: { id: 1, username: 'Demo User', name: 'Demo User', email: 'demo@example.com', role: 'Decision Maker' } });
  }

  try {
    const result = await db.query(
      'SELECT id, username, email, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found' });

    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('/me error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
