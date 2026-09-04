/**
 * JWT Access & Refresh Token Utilities
 * -----------------------------------------------------------------
 * Access tokens: short-lived (15 min), Bearer in Authorization header
 * Refresh tokens: httpOnly + Secure cookie, 7-day expiry, rotation
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || '64fff131e5bac1b9c938e68f0b22a08e2514b877bcf8ef3ca6c73b5fda460fc7';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || '64fff131e5bac1b9c938e68f0b22a08e2514b877bcf8ef3ca6c73b5fda460fc7';

// ---- Access Token ----
// Signed with short expiry. Payload includes user id, role, permissions.
export const signAccessToken = (payload) => {
  const defaultPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + 15 * 60 * 1000) / 1000), // 15 min
  };
  return jwt.sign(defaultPayload, ACCESS_SECRET);
};

// ---- Refresh Token ----
// Signed with longer expiry. Rotated on each use (one-time use).
export const signRefreshToken = (payload) => {
  const defaultPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000), // 7 days
  };
  return jwt.sign(defaultPayload, REFRESH_SECRET);
};

// ---- Verify Access Token ----
// Extracted from Authorization: Bearer <token> header
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (err) {
    return null;
  }
};

// ---- Verify Refresh Token ----
// Extracted from httpOnly Secure cookie
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (err) {
    return null;
  }
};

// ---- Helper: extract token from Authorization header ----
export const extractAccessToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

// ---- Helper: generate MFA TOTP secret + QR code data URI ----
export const generateMfaSecret = () => {
  // otplib will be used by the caller; return a random base32 string
  return crypto.randomBytes(20).toString('base64').replace(/[=+\/]/g, '').substring(0, 32);
};