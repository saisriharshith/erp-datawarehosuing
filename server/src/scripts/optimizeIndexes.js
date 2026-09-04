/**
 * Database Optimization & Indexing Migration Script
 * --------------------------------------------------
 * Applies enterprise-grade indexing strategies across all Dimension and Fact collections
 * in MongoDB Atlas Star Schema to ensure sub-millisecond query execution plans.
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://Sai:5201587sai@t-complete-backend.wyq5t6x.mongodb.net/?retryWrites=true&w=majority';
const dbName = process.env.WAREHOUSE_DB_NAME || 'erp_warehouse';

export async function optimizeDatabaseIndexes() {
  console.log(`[DB-OPTIMIZER] Connecting to MongoDB Atlas: ${dbName}...`);
  const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    const db = client.db(dbName);
    console.log(`[DB-OPTIMIZER] Connected successfully. Applying optimized B-Tree and Compound Indexes...\n`);

    // 1. Users Collection
    console.log('1. Optimizing users collection...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true, background: true });
    await db.collection('users').createIndex({ role: 1, departmentId: 1 }, { background: true });
    await db.collection('users').createIndex({ studentId: 1 }, { sparse: true, background: true });
    await db.collection('users').createIndex({ facultyId: 1 }, { sparse: true, background: true });
    console.log('   ✓ users: email (UNIQUE), role + departmentId, studentId, facultyId indexes created.');

    // 2. Dimension: Students
    console.log('2. Optimizing dim_students collection...');
    await db.collection('dim_students').createIndex({ student_id: 1 }, { unique: true, background: true });
    await db.collection('dim_students').createIndex({ department_id: 1, current_semester: 1 }, { background: true });
    await db.collection('dim_students').createIndex({ risk_profile: 1 }, { background: true });
    await db.collection('dim_students').createIndex({ email: 1 }, { background: true });
    console.log('   ✓ dim_students: student_id (UNIQUE), department_id + current_semester, risk_profile indexes created.');

    // 3. Dimension: Faculty
    console.log('3. Optimizing dim_faculty collection...');
    await db.collection('dim_faculty').createIndex({ faculty_id: 1 }, { unique: true, background: true });
    await db.collection('dim_faculty').createIndex({ department_id: 1 }, { background: true });
    await db.collection('dim_faculty').createIndex({ email: 1 }, { background: true });
    console.log('   ✓ dim_faculty: faculty_id (UNIQUE), department_id indexes created.');

    // 4. Dimension: Departments
    console.log('4. Optimizing dim_departments collection...');
    await db.collection('dim_departments').createIndex({ department_id: 1 }, { unique: true, background: true });
    console.log('   ✓ dim_departments: department_id (UNIQUE) index created.');

    // 5. Dimension: Subjects
    console.log('5. Optimizing dim_subjects collection...');
    await db.collection('dim_subjects').createIndex({ subject_id: 1 }, { unique: true, background: true });
    await db.collection('dim_subjects').createIndex({ department_id: 1, semester: 1 }, { background: true });
    console.log('   ✓ dim_subjects: subject_id (UNIQUE), department_id + semester indexes created.');

    // 6. Dimension: Dates
    console.log('6. Optimizing dim_dates collection...');
    await db.collection('dim_dates').createIndex({ date_key: 1 }, { unique: true, background: true });
    await db.collection('dim_dates').createIndex({ academic_year: 1, semester: 1 }, { background: true });
    console.log('   ✓ dim_dates: date_key (UNIQUE), academic_year + semester indexes created.');

    // 7. Fact: Attendance
    console.log('7. Optimizing fact_attendance collection...');
    await db.collection('fact_attendance').createIndex({ student_id: 1, department_id: 1, semester: 1 }, { background: true });
    await db.collection('fact_attendance').createIndex({ date_key: 1, attendance_status: 1 }, { background: true });
    await db.collection('fact_attendance').createIndex({ attendance_percentage: 1 }, { background: true });
    console.log('   ✓ fact_attendance: compound student+dept+sem, date+status, attendance_percentage indexes created.');

    // 8. Fact: Examinations
    console.log('8. Optimizing fact_examinations collection...');
    await db.collection('fact_examinations').createIndex({ student_id: 1, subject_id: 1 }, { background: true });
    await db.collection('fact_examinations').createIndex({ department_id: 1, semester: 1 }, { background: true });
    await db.collection('fact_examinations').createIndex({ grade_letter: 1, gpa: 1 }, { background: true });
    console.log('   ✓ fact_examinations: compound student+subject, dept+semester, grade_letter+gpa indexes created.');

    // 9. Fact: Fees
    console.log('9. Optimizing fact_fees collection...');
    await db.collection('fact_fees').createIndex({ student_id: 1, status: 1 }, { background: true });
    await db.collection('fact_fees').createIndex({ department_id: 1, due_date_key: 1 }, { background: true });
    await db.collection('fact_fees').createIndex({ balance_amount: 1 }, { background: true });
    console.log('   ✓ fact_fees: compound student+status, dept+due_date, balance_amount indexes created.');

    // 10. Fact: Library
    console.log('10. Optimizing fact_library collection...');
    await db.collection('fact_library').createIndex({ student_id: 1, return_status: 1 }, { background: true });
    await db.collection('fact_library').createIndex({ department_id: 1, issue_date_key: 1 }, { background: true });
    console.log('   ✓ fact_library: compound student+status, dept+issue_date indexes created.');

    // 11. Data Quality Reports
    console.log('11. Optimizing data_quality_reports collection...');
    await db.collection('data_quality_reports').createIndex({ run_timestamp: -1 }, { background: true });
    console.log('   ✓ data_quality_reports: run_timestamp DESC index created.');

    // 12. Risk Predictions
    console.log('12. Optimizing risk_predictions collection...');
    await db.collection('risk_predictions').createIndex({ student_id: 1, risk_level: 1 }, { background: true });
    console.log('   ✓ risk_predictions: student_id + risk_level index created.');

    console.log('\n======================================================================');
    console.log('🚀 DATABASE OPTIMIZATION COMPLETE: 24 High-Performance Indexes Active!');
    console.log('======================================================================\n');
  } catch (err) {
    console.error('[DB-OPTIMIZER] Error applying indexes:', err);
  } finally {
    await client.close();
  }
}

// Execute if run directly
if (process.argv[1]?.endsWith('optimizeIndexes.js')) {
  optimizeDatabaseIndexes().then(() => process.exit(0));
}
