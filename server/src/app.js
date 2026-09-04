/**
 * Express Application Configuration (MERN Backend)
 * ------------------------------------------------
 * Sets up middleware, MongoDB connection, REST API routes, and SPA static hosting.
 * ALL non-auth routes are protected by JWT + RBAC middleware.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import cookieParser from 'cookie-parser';

import { dbManager } from './config/db.js';
import { successResponse } from './utils/helpers.js';

import authRouter from './routes/auth.routes.js';
import analyticsRouter from './routes/analytics.routes.js';
import studentsRouter from './routes/students.routes.js';
import studentPortalRouter from './routes/studentPortal.routes.js';
import facultyRouter from './routes/faculty.routes.js';
import { attendanceRouter, examinationsRouter, feesRouter, libraryRouter } from './routes/coreAnalytics.routes.js';
import predictionRouter from './routes/prediction.routes.js';
import qualityRouter from './routes/quality.routes.js';
import etlRouter from './routes/etl.routes.js';

import compression from 'compression';
import { optionalAuth } from './middleware/auth.js';

// Load env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- Security middleware ---

// Helmet: set security HTTP headers
app.use(helmet());

// Cookie-parser: needed for httpOnly refresh tokens
app.use(cookieParser());

// CORS: lock to frontend origin only (no more wildcard *)
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // allow cookies (refresh token)
}));

// Performance middleware
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static build if present
const clientDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(clientDist));

// --- REST API under /api ---

// Auth middleware attaches req.user if Bearer token is provided
app.use('/api', optionalAuth);

// --- Health Check API ---
app.get('/api/health', (req, res) => {
  const health = dbManager.getHealth();
  return successResponse(res, {
    status: 'online',
    framework: 'Node.js Express (MERN Stack)',
    ...health
  }, 'MERN Stack API Operational');
});

// Mount modular REST API Blueprints
app.use('/api/auth', authRouter);
app.use('/api/api/auth', authRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/student-portal', studentPortalRouter);
app.use('/api/faculty', facultyRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/examinations', examinationsRouter);
app.use('/api/fees', feesRouter);
app.use('/api/library', libraryRouter);
app.use('/api/prediction', predictionRouter);
app.use('/api/quality', qualityRouter);
app.use('/api/etl', etlRouter);

// Also mount routers under /api root for legacy direct endpoint compatibility
app.use('/api', authRouter);
app.use('/api', analyticsRouter);
app.use('/api', studentsRouter);
app.use('/api', studentPortalRouter);
app.use('/api', facultyRouter);
app.use('/api', attendanceRouter);
app.use('/api', examinationsRouter);
app.use('/api', feesRouter);
app.use('/api/library', libraryRouter);
app.use('/api', predictionRouter);
app.use('/api', qualityRouter);
app.use('/api', etlRouter);

// --- SPA route fallback for React Router ---
app.get('*', (req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  if (req.accepts('html') && !req.path.startsWith('/api')) {
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head><title>ERP Data Warehouse & Decision Support System (MERN Stack)</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
              <h2>⚡ ERP Decision Support MERN Backend Running</h2>
              <p>REST APIs are active at <a href="/api/health">/api/health</a> and <a href="/api/analytics/dashboard">/api/analytics/dashboard</a>.</p>
              <p>React Frontend dev server: <code>http://localhost:3000</code> or <code>http://localhost:5173</code>.</p>
            </body>
          </html>
        `);
      }
    });
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

export default app;