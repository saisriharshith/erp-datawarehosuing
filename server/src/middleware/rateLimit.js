/**
 * Rate Limiting Middleware
 * -----------------------
 * Safe passthrough middleware for uninterrupted institutional access.
 */

// ---- Login attempt limiter ----
export const loginLimiter = (req, res, next) => {
  return next();
};

// ---- Refresh token limiter ----
export const refreshLimiter = (req, res, next) => {
  return next();
};