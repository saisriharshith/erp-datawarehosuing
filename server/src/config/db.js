/**
 * Optimized MongoDB Atlas Database Manager & Local Snapshot Fallback
 * ------------------------------------------------------------------
 * Implements connection pooling, query caching with TTL, and seamless fallback.
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseManager {
  constructor() {
    this.client = null;
    this.sourceDb = null;
    this.warehouseDb = null;
    this.isConnected = false;
    this.localCache = null;
    this._memoryCache = new Map();
    this._cacheTTL = 60 * 1000; // 60 seconds TTL for fast queries
  }

  async connect(
    uri = process.env.MONGODB_URI || 'mongodb+srv://Sai:5201587sai@t-complete-backend.wyq5t6x.mongodb.net/?retryWrites=true&w=majority',
    warehouseDbName = process.env.WAREHOUSE_DB_NAME || 'erp_warehouse',
    sourceDbName = process.env.SOURCE_DB_NAME || 'erp_source'
  ) {
    this.loadLocalCache();

    if (!uri) {
      console.log('[DB-MANAGER] No MONGODB_URI configured. Running in Standalone Snapshot mode.');
      return;
    }

    try {
      this.client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 5000,
        maxPoolSize: 20,
        minPoolSize: 5
      });

      await this.client.connect();
      await this.client.db('admin').command({ ping: 1 });
      this.warehouseDb = this.client.db(warehouseDbName);
      this.sourceDb = this.client.db(sourceDbName);
      this.isConnected = true;
      console.log(`[DB-MANAGER] Connected to MongoDB Atlas Cluster: ${warehouseDbName}`);
    } catch (err) {
      console.warn(`[DB-MANAGER] MongoDB connection failed (${err.message}). Using local snapshot cache.`);
      this.isConnected = false;
    }
  }

  loadLocalCache() {
    const snapshotPath = path.resolve(__dirname, '../../../data/warehouse/warehouse_snapshot.json');
    if (fs.existsSync(snapshotPath)) {
      try {
        const raw = fs.readFileSync(snapshotPath, 'utf-8');
        this.localCache = JSON.parse(raw);
        this._memoryCache.clear();
        console.log('[DB-MANAGER] Local warehouse snapshot loaded successfully.');
      } catch (e) {
        console.error('[DB-MANAGER] Error reading local snapshot:', e);
        this.localCache = {};
      }
    } else {
      this.localCache = {};
    }
  }

  async getCollectionData(collectionName, bypassCache = false) {
    // Check in-memory TTL cache first
    const now = Date.now();
    if (!bypassCache && this._memoryCache.has(collectionName)) {
      const cached = this._memoryCache.get(collectionName);
      if (now - cached.timestamp < this._cacheTTL) {
        return cached.data;
      }
    }

    let data = [];

    // Live MongoDB Atlas query
    if (this.isConnected && this.warehouseDb) {
      try {
        const docs = await this.warehouseDb.collection(collectionName).find({}, { projection: { _id: 0 } }).toArray();
        if (docs && docs.length > 0) {
          data = docs;
        }
      } catch (err) {
        console.warn(`[DB-MANAGER] Live query on '${collectionName}' failed, falling back to cache:`, err.message);
      }
    }

    // Fallback to local snapshot cache
    if (!data || data.length === 0) {
      if (!this.localCache) {
        this.loadLocalCache();
      }

      if (this.localCache.dimensions && this.localCache.dimensions[collectionName]) {
        data = this.localCache.dimensions[collectionName];
      } else if (this.localCache.facts && this.localCache.facts[collectionName]) {
        data = this.localCache.facts[collectionName];
      } else if (this.localCache[collectionName]) {
        data = this.localCache[collectionName];
      } else if (collectionName === 'risk_predictions') {
        const riskPath = path.resolve(__dirname, '../../../data/warehouse/risk_predictions.json');
        if (fs.existsSync(riskPath)) {
          data = JSON.parse(fs.readFileSync(riskPath, 'utf-8'));
        }
      }
    }

    // Cache the result in memory
    this._memoryCache.set(collectionName, { timestamp: now, data });
    return data;
  }

  getHealth() {
    return {
      mongodb_connected: this.isConnected,
      mode: this.isConnected ? 'Live MongoDB Atlas Cluster' : 'Standalone Cache (Resilient Fallback)',
      warehouse_status: 'Ready',
      cached_collections_count: this._memoryCache.size,
      active_collections: [
        'dim_students', 'dim_departments', 'dim_subjects', 'dim_faculty', 'dim_dates',
        'fact_attendance', 'fact_examinations', 'fact_fees', 'fact_library',
        'data_quality_reports', 'risk_predictions', 'kpi_lineage_definitions'
      ]
    };
  }
}

export const dbManager = new DatabaseManager();
