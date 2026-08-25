/**
 * ETL Load & Snapshot Loader (Pure Node.js)
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadData(transformedData, qualityReport, uri = process.env.MONGODB_URI, dbName = process.env.WAREHOUSE_DB_NAME || 'erp_warehouse') {
  console.log('[ETL-LOAD] Persisting Star Schema and Quality Reports...');

  // 1. Save local snapshot
  const snapshotPath = path.resolve(__dirname, '../../../data/warehouse/warehouse_snapshot.json');
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });

  const snapshot = {
    dimensions: transformedData.dimensions,
    facts: transformedData.facts,
    data_quality_reports: [qualityReport]
  };

  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log(`[ETL-LOAD] Saved local warehouse snapshot to ${snapshotPath}`);

  // 2. Load to live MongoDB Atlas if reachable
  if (uri) {
    try {
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
      await client.connect();
      const db = client.db(dbName);

      // Load dimensions
      for (const [colName, docs] of Object.entries(transformedData.dimensions)) {
        if (docs.length > 0) {
          const col = db.collection(colName);
          const ops = docs.map(d => ({
            updateOne: {
              filter: { _id: d._id },
              update: { $set: d },
              upsert: true
            }
          }));
          await col.bulkWrite(ops, { ordered: false });
        }
      }

      // Load facts
      for (const [colName, docs] of Object.entries(transformedData.facts)) {
        if (docs.length > 0) {
          const col = db.collection(colName);
          const ops = docs.map(d => ({
            updateOne: {
              filter: { _id: d._id },
              update: { $set: d },
              upsert: true
            }
          }));
          await col.bulkWrite(ops, { ordered: false });
        }
      }

      // Save quality report
      await db.collection('data_quality_reports').insertOne(qualityReport);

      await client.close();
      console.log(`[ETL-LOAD] Successfully loaded Star Schema to MongoDB Atlas Cluster: ${dbName}`);
      return true;
    } catch (err) {
      console.warn(`[ETL-LOAD] MongoDB load failed (${err.message}). Local snapshot saved.`);
    }
  }

  return true;
}
