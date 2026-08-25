/**
 * Express Server Entry Point (MERN Backend)
 * -----------------------------------------
 * Connects to MongoDB Atlas / Local cache and exposes modular REST APIs.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static build if present
const clientDist = path.resolve(__dirname, '../../client-react/dist');
app.use(express.static(clientDist));

// Mount REST API Blueprints under /api
app.use('/api', authRouter);
app.use('/api', analyticsRouter);
app.use('/api', studentsRouter);
app.use('/api', studentPortalRouter);
app.use('/api', facultyRouter);
app.use('/api', attendanceRouter);
app.use('/api', examinationsRouter);
app.use('/api', feesRouter);
app.use('/api', libraryRouter);
app.use('/api', predictionRouter);
app.use('/api', qualityRouter);
app.use('/api', etlRouter);

// Health Check API
app.get('/api/health', (req, res) => {
  const health = dbManager.getHealth();
  return successResponse(res, {
    status: 'online',
    framework: 'Node.js Express (MERN Stack)',
    ...health
  }, 'MERN Stack API Operational');
});

// Single Page Application route fallback for React Router
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
              <h2>⚡ ERP Decision Support MERN Backend Running on Port ${PORT}</h2>
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

// Connect to MongoDB Atlas and Start Server
export async function startServer(port = PORT) {
  await dbManager.connect();
  return app.listen(port, () => {
    console.log(`======================================================================`);
    console.log(`🚀 MERN BACKEND SERVER RUNNING ON: http://localhost:${port}`);
    console.log(`📡 Health Check:  http://localhost:${port}/api/health`);
    console.log(`📊 Dashboard API: http://localhost:${port}/api/analytics/dashboard`);
    console.log(`======================================================================`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
