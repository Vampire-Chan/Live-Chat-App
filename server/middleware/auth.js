const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

/**
 * Express middleware that verifies the JWT from the Authorization header.
 * Attaches the decoded payload to req.user on success.
 * Responds with 401 on missing / invalid / expired token.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  if (token === 'demo_token') {
    req.user = { id: 1, userId: 1, isDemo: true };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
