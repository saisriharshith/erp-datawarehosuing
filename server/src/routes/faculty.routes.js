/**
 * Faculty Management & Department Analytics Routes
 */

import express from 'express';
import { dbManager } from '../config/db.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

const router = express.Router();

router.get('/faculty/summary', async (req, res) => {
  const { department_id } = req.query;

  try {
    let faculty = await dbManager.getCollectionData('dim_faculty');
    if (department_id) {
      faculty = faculty.filter(f => f.department_id === department_id);
    }

    const totalFaculty = faculty.length;
    const workloads = faculty.map(f => f.workload_hours_per_week || 0);
    const avgWorkload = workloads.length ? Number((workloads.reduce((a, b) => a + b, 0) / workloads.length).toFixed(1)) : 16.0;

    const desigMap = {};
    faculty.forEach(f => {
      const d = f.designation || 'Lecturer';
      desigMap[d] = (desigMap[d] || 0) + 1;
    });

    const expList = faculty.map(f => f.experience_years || 0);
    const avgExp = expList.length ? Number((expList.reduce((a, b) => a + b, 0) / expList.length).toFixed(1)) : 8.5;

    return successResponse(res, {
      total_faculty: totalFaculty,
      average_weekly_workload_hours: avgWorkload,
      average_experience_years: avgExp,
      designations: desigMap,
      faculty_list: faculty
    }, 'Faculty analytics summary fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

export default router;
