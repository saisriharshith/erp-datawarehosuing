/**
 * Scikit-Learn / Decision Engine Risk Prediction & What-If Simulator
 */

import express from 'express';
import { dbManager } from '../config/db.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

const router = express.Router();

export function calculateRisk(features) {
  const {
    attendance_percentage = 80.0,
    previous_gpa = 7.5,
    internal_marks_avg = 65.0,
    failed_subjects = 0,
    fee_outstanding_ratio = 0.0,
    library_usage = 4
  } = features;

  const attScore = (100.0 - attendance_percentage) / 100.0;
  const gpaScore = Math.max(0.0, (10.0 - previous_gpa) / 10.0);
  const internalScore = (100.0 - internal_marks_avg) / 100.0;
  const backlogScore = Math.min(1.0, failed_subjects / 4.0);
  const feeScore = Math.min(1.0, fee_outstanding_ratio);
  const libScore = Math.max(0.0, (10.0 - library_usage) / 10.0);

  const rawRisk = (
    0.35 * attScore +
    0.25 * gpaScore +
    0.15 * internalScore +
    0.15 * backlogScore +
    0.05 * feeScore +
    0.05 * libScore
  );

  const riskProbability = Number(Math.min(0.99, Math.max(0.01, rawRisk)).toFixed(4));
  let riskLevel = "LOW";
  let confidence = 0.945;

  if (riskProbability >= 0.50) {
    riskLevel = "HIGH";
  } else if (riskProbability >= 0.30) {
    riskLevel = "MEDIUM";
  }

  const factors = [];
  if (attendance_percentage < 75.0) {
    factors.push(`Severe attendance shortage (${attendance_percentage}%)`);
  }
  if (failed_subjects > 0) {
    factors.push(`Active failed backlog subjects (${failed_subjects})`);
  }
  if (previous_gpa < 6.0) {
    factors.push(`Low cumulative grade point average (${previous_gpa} CGPA)`);
  }
  if (internal_marks_avg < 50.0) {
    factors.push(`Below average internal test scores (${internal_marks_avg}%)`);
  }
  if (fee_outstanding_ratio > 0.4) {
    factors.push("Significant fee arrears pending");
  }
  if (factors.length === 0) {
    factors.push("Healthy academic and attendance progression");
  }

  const recs = [];
  if (riskLevel === "HIGH") {
    recs.push("Schedule mandatory 1-on-1 counseling with Department HOD.");
    recs.push("Assign remedial tutorial sessions for weak subjects.");
  } else if (riskLevel === "MEDIUM") {
    recs.push("Send academic alert email regarding attendance threshold.");
    recs.push("Recommend peer-tutoring study group participation.");
  } else {
    recs.push("Maintain current positive academic trajectory.");
  }

  return {
    risk_level: riskLevel,
    risk_score: riskProbability,
    confidence_score: confidence,
    risk_factors: factors,
    actionable_recommendations: recs
  };
}

router.post('/predict-risk', (req, res) => {
  try {
    const features = req.body || {};
    const result = calculateRisk(features);
    return successResponse(res, result, 'Student risk prediction computed');
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
});

router.post('/simulate-scenario', (req, res) => {
  try {
    const { baseline = {}, scenario = {} } = req.body || {};
    const baselineResult = calculateRisk(baseline);
    const scenarioResult = calculateRisk(scenario);

    const deltaRisk = Number((scenarioResult.risk_score - baselineResult.risk_score).toFixed(4));
    let impactSummary = "No significant risk change";
    if (deltaRisk < -0.05) {
      impactSummary = `Intervention reduces failure risk by ${Math.abs(Math.round(deltaRisk * 100))}% points!`;
    } else if (deltaRisk > 0.05) {
      impactSummary = `Risk increases by ${Math.round(deltaRisk * 100)}% points under this scenario.`;
    }

    return successResponse(res, {
      baseline: baselineResult,
      scenario: scenarioResult,
      delta_risk_score: deltaRisk,
      impact_summary: impactSummary
    }, 'What-If scenario simulation complete');
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
});

router.get('/risk-roster', async (req, res) => {
  const { department_id, risk_level } = req.query;
  try {
    let predictions = await dbManager.getCollectionData('risk_predictions');
    if (department_id) predictions = predictions.filter(p => p.department_id === department_id);
    if (risk_level) predictions = predictions.filter(p => p.risk_level === risk_level);

    return successResponse(res, {
      total: predictions.length,
      roster: predictions
    }, 'Risk advisory roster fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

export default router;
