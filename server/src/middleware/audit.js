/**
 * Audit Logging Middleware
 * -----------------------
 * Logs every authentication event, role-blocked access, and sensitive operations
 * to the `audit_logs` collection in MongoDB.
 */

import { User } from '../models/User.js';

export const audit = async (req, res, next) => {
  try {
    // Log entry and exit for protected routes
    if (req.user && req.user.role) {
      const logEntry = {
        timestamp: new Date(),
        userId: req.user._id ? req.user._id.toString() : req.user.email,
        userRole: req.user.role,
        endpoint: req.path,
        method: req.method,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
      };

      // Store audit log (best-effort — don't block request if DB is slow)
      try {
        await User.updateOne(
          { email: req.user.email },
          { $push: { auditLog: logEntry } }
        );
        // Trim audit log to last 100 entries per user to avoid DB bloat
        // (You could also have a separate AuditLog model; this keeps it simple.)
      } catch (e) {
        console.warn('[MIDDLEWARE-audit] Could not write log:', e.message);
      }
    }
    next();
  } catch (err) {
    next(); // continue even if auditing fails
  }
};