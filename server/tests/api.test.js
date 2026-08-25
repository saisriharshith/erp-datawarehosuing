import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';
import { dbManager } from '../src/config/db.js';

let server;
let baseUrl;

before(async () => {
  await dbManager.connect();
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api`;
});

after((done) => {
  if (server) server.close(done);
  else done();
});

describe('MERN Backend API Test Suite', () => {
  test('GET /api/health should return online status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.framework, 'Node.js Express (MERN Stack)');
  });

  test('POST /api/auth/login with valid credentials should authenticate', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@univ.edu', password: 'demo1234' })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.role, 'ADMIN');
    assert.ok(json.data.token);
  });

  test('POST /api/auth/login with invalid password should fail with 401', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@univ.edu', password: 'wrongpassword' })
    });
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.success, false);
  });

  test('GET /api/analytics/dashboard should return summary KPIs', async () => {
    const res = await fetch(`${baseUrl}/analytics/dashboard`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.summary_kpis.total_students > 0);
    assert.ok(json.data.department_breakdown.length > 0);
  });

  test('GET /api/student/portal-summary for STU20220013 should return student hub', async () => {
    const res = await fetch(`${baseUrl}/student/portal-summary?student_id=STU20220013`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.student.student_id);
    assert.ok(json.data.summary_cards.attendance_percentage !== undefined);
  });

  test('GET /api/faculty/summary should return department faculty', async () => {
    const res = await fetch(`${baseUrl}/faculty/summary?department_id=DEPT_CSE`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.faculty_list.length > 0);
  });

  test('POST /api/predict-risk should return ML risk prediction', async () => {
    const res = await fetch(`${baseUrl}/predict-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attendance_percentage: 55.0,
        previous_gpa: 5.2,
        internal_marks_avg: 40.0,
        failed_subjects: 2,
        fee_outstanding_ratio: 0.3,
        library_usage: 1
      })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(json.data.risk_level));
    assert.ok(json.data.risk_score > 0);
  });

  test('POST /api/simulate-scenario should return delta risk impact', async () => {
    const res = await fetch(`${baseUrl}/simulate-scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseline: { attendance_percentage: 50.0, previous_gpa: 5.0, internal_marks_avg: 40.0 },
        scenario: { attendance_percentage: 85.0, previous_gpa: 7.5, internal_marks_avg: 70.0 }
      })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.delta_risk_score < 0);
  });

  test('GET /api/data-quality should return 5-dimension quality scores', async () => {
    const res = await fetch(`${baseUrl}/data-quality`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.latest_report.dimensions.overall_score >= 90.0);
  });
});
