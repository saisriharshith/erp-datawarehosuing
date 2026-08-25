/**
 * ETL Extract Stage (Pure Node.js)
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSyntheticERPData } from '../scripts/generateData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function extractData(uri = process.env.MONGODB_URI, dbName = process.env.SOURCE_DB_NAME || 'erp_source') {
  if (uri) {
    try {
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
      await client.connect();
      const db = client.db(dbName);

      const collections = [
        "departments", "subjects", "faculty", "students", "admissions",
        "attendance", "examinations", "fees", "library"
      ];

      const extracted = {};
      let total = 0;
      for (const col of collections) {
        const docs = await db.collection(col).find({}, { projection: { _id: 0 } }).toArray();
        extracted[col] = docs;
        total += docs.length;
      }
      await client.close();
      if (total > 0) {
        console.log(`[ETL-EXTRACT] Extracted ${total} raw documents from MongoDB Atlas: ${dbName}`);
        return extracted;
      }
    } catch (err) {
      console.warn(`[ETL-EXTRACT] Live extraction failed (${err.message}). Using synthetic generator.`);
    }
  }

  // Fallback to synthetic generator
  return generateSyntheticERPData(600);
}
