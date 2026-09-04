/**
 * Authentication Middleware
 * -------------------------
 * - Verifies Bearer access token from Authorization header
 * - Attaches req.user (full User document)
 * - Handles token refresh fallback from httpOnly cookie
 * - Rejects locked-out accounts
 */

import { extractAccessToken, verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

// ---- Protect route: verify access token ----
export const auth = async (req, res, next) => {
  try {
    const token = extractAccessToken(req.headers.authorization);
    if (!token) return res.status(401).json({ message: 'Access token missing' });

    const payload = verifyAccessToken(token);
    if (!payload) return res.status(401).json({ message: 'Invalid or expired access token' });

    // Attach full user document to req.user
    const user = await User.findByEmail(payload.email);
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Check lockout
    if (user.isLocked()) {
      return res.status(403).json({
        message: `Account locked until ${new Date(user.lockedUntil).toLocaleString()}`,
      });
    }

    // Check mustChangePassword flag
    if (user.mustChangePassword && req.path !== '/auth/change-password') {
      return res.status(403).json({
        message: 'Password change required. Please use /auth/change-password.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[MIDDLEWARE-auth] Error:', err.message);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// ---- Optional auth: attach user if token present, but don't fail ----
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractAccessToken(req.headers.authorization);
    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        const user = await User.findByEmail(payload.email);
        if (user) {
          req.user = user;
        }
      }
    }
    next();
  } catch (err) {
    next(); // continue without user if token is bad
  }
};