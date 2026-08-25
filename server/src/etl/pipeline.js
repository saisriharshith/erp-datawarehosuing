/**
 * Pure Node.js ETL Pipeline Runner
 */

import dotenv from 'dotenv';
import { extractData } from './extract.js';
import { transformData } from './transform.js';
import { validateDataQuality } from './validate.js';
import { loadData } from './load.js';

dotenv.config();

export async function runETLPipeline(uri = process.env.MONGODB_URI, sourceDb = process.env.SOURCE_DB_NAME || 'erp_source', warehouseDb = process.env.WAREHOUSE_DB_NAME || 'erp_warehouse') {
  const startTime = Date.now();
  console.log('======================================================================');
  console.log('STARTING MERN DATA WAREHOUSE ETL PIPELINE (Pure JavaScript)');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Source DB:    ${sourceDb}`);
  console.log(`Warehouse DB: ${warehouseDb}`);
  console.log('======================================================================');

  // 1. Extract
  const rawData = await extractData(uri, sourceDb);

  // 2. Transform
  const transformedData = transformData(rawData);

  // 3. Validate
  const qualityReport = validateDataQuality(rawData, transformedData);

  // 4. Load
  await loadData(transformedData, qualityReport, uri, warehouseDb);

  const elapsed = Number(((Date.now() - startTime) / 1000).toFixed(2));
  console.log('\n======================================================================');
  console.log(`ETL PIPELINE COMPLETED SUCCESSFULLY IN ${elapsed}s`);
  console.log(`  • Data Quality Score: ${qualityReport.metrics.overall_score}%`);
  console.log('======================================================================\n');

  return {
    success: true,
    elapsed_seconds: elapsed,
    quality_report: qualityReport
  };
}

if (process.argv[1] && process.argv[1].endsWith('pipeline.js')) {
  runETLPipeline().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
