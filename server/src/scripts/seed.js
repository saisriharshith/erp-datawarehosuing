/**
 * Pure JavaScript Database Seeder for MongoDB Atlas erp_source
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { generateSyntheticERPData } from './generateData.js';

dotenv.config();

const uri = process.env.MONGODB_URI;
const sourceDbName = process.env.SOURCE_DB_NAME || 'erp_source';

async function seed() {
  console.log('============================================================');
  console.log(`SEEDING MONGODB SOURCE DATABASE (Pure Node.js)`);
  console.log(`URI: ${uri ? uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'Local'}`);
  console.log(`DB:  ${sourceDbName}`);
  console.log('============================================================');

  const rawData = generateSyntheticERPData(600);

  if (!uri) {
    console.log('No MONGODB_URI provided. Seeding local memory only.');
    return;
  }

  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db(sourceDbName);

    for (const [colName, docs] of Object.entries(rawData)) {
      const col = db.collection(colName);
      await col.deleteMany({});
      if (docs.length > 0) {
        await col.insertMany(docs);
        console.log(`  • Inserted ${String(docs.length).padStart(5)} records into '${colName}'`);
      }
    }

    await client.close();
    console.log('\n✓ MongoDB Atlas erp_source Seeding Completed Successfully.');
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
}

seed();
