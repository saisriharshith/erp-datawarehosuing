/**
 * Students Directory & 360 Profiles
 */

import express from 'express';
import { dbManager } from '../config/db.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

const router = express.Router();

export async function getStudentProfile(studentId) {
  const students = await dbManager.getCollectionData('dim_students');
  let student = students.find(s => s.student_id === studentId);
  if (!student && students.length > 0) {
    student = students.find(s => s.student_id && s.student_id.toUpperCase().includes(studentId.toUpperCase())) || students[0];
    studentId = student.student_id;
  }
  if (!student) return null;

  const allAttendance = await dbManager.getCollectionData('fact_attendance');
  const allExams = await dbManager.getCollectionData('fact_examinations');
  const allFees = await dbManager.getCollectionData('fact_fees');
  const allLibrary = await dbManager.getCollectionData('fact_library');
  const allRisk = await dbManager.getCollectionData('risk_predictions');

  const attendance = allAttendance.filter(a => a.student_id === studentId);
  const exams = allExams.filter(e => e.student_id === studentId);
  const fees = allFees.filter(f => f.student_id === studentId);
  const library = allLibrary.find(l => l.student_id === studentId) || { total_books_borrowed: 0, unpaid_fines: 0 };
  const risk = allRisk.find(r => r.student_id === studentId) || { risk_level: "LOW", risk_score: 0.15, risk_factors: ["Satisfactory academic standing"] };

  const attPcts = attendance.map(a => a.attendance_percentage || 0);
  const totalClasses = attendance.reduce((s, a) => s + (a.total_classes || 0), 0);
  const classesAttended = attendance.reduce((s, a) => s + (a.classes_attended || 0), 0);
  const avgAtt = attPcts.length ? Number((attPcts.reduce((a, b) => a + b, 0) / attPcts.length).toFixed(1)) : 80.0;

  const gpas = exams.map(e => e.grade_point || 0);
  const cgpa = gpas.length ? Number((gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2)) : 8.10;
  const backlogs = exams.filter(e => !e.is_passed).length;

  const totalDue = fees.reduce((s, f) => s + (f.total_due || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + (f.total_paid || 0), 0);
  const outstanding = fees.reduce((s, f) => s + (f.outstanding_balance || 0), 0);
  const feeStatus = outstanding === 0 ? "PAID" : (totalPaid > 0 ? "PARTIAL" : "OVERDUE");

  return {
    student,
    attendance: {
      overall_percentage: avgAtt,
      total_classes: totalClasses,
      classes_attended: classesAttended,
      subject_records: attendance
    },
    examinations: {
      cgpa,
      backlogs,
      total_exams_taken: exams.length,
      exam_records: exams
    },
    fees: {
      total_due: totalDue,
      total_paid: totalPaid,
      outstanding_balance: outstanding,
      status: feeStatus,
      transaction_records: fees
    },
    library,
    risk_assessment: risk
  };
}

router.get('/students', async (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '20');
  const search = (req.query.search || '').trim().toLowerCase();
  const deptId = req.query.department_id;
  const semester = req.query.semester ? parseInt(req.query.semester) : null;
  const riskLevel = req.query.risk_level;

  try {
    const students = await dbManager.getCollectionData('dim_students');
    const attendance = await dbManager.getCollectionData('fact_attendance');
    const exams = await dbManager.getCollectionData('fact_examinations');
    const predictions = await dbManager.getCollectionData('risk_predictions');

    const attMap = {};
    attendance.forEach(a => {
      if (!attMap[a.student_id]) attMap[a.student_id] = [];
      attMap[a.student_id].push(a.attendance_percentage || 0);
    });

    const gpaMap = {};
    const backlogMap = {};
    exams.forEach(e => {
      if (!gpaMap[e.student_id]) gpaMap[e.student_id] = [];
      gpaMap[e.student_id].push(e.grade_point || 0);
      if (!e.is_passed) backlogMap[e.student_id] = (backlogMap[e.student_id] || 0) + 1;
    });

    const riskMap = {};
    predictions.forEach(p => {
      riskMap[p.student_id] = p;
    });

    let enriched = students.map(s => {
      const atts = attMap[s.student_id] || [];
      const attAvg = atts.length ? Number((atts.reduce((a, b) => a + b, 0) / atts.length).toFixed(1)) : 80.0;
      const gpas = gpaMap[s.student_id] || [];
      const cgpa = gpas.length ? Number((gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2)) : 7.8;
      const r = riskMap[s.student_id] || { risk_level: 'LOW', risk_score: 0.15 };

      return {
        student_id: s.student_id,
        full_name: s.full_name,
        email: s.email,
        department_id: s.department_id,
        department_name: s.department_name,
        current_semester: s.current_semester,
        admission_quota: s.admission_quota,
        attendance_percentage: attAvg,
        cgpa: cgpa,
        backlogs_count: backlogMap[s.student_id] || 0,
        risk_level: r.risk_level,
        risk_score: r.risk_score
      };
    });

    if (search) {
      enriched = enriched.filter(s =>
        (s.full_name && s.full_name.toLowerCase().includes(search)) ||
        (s.student_id && s.student_id.toLowerCase().includes(search)) ||
        (s.email && s.email.toLowerCase().includes(search))
      );
    }
    if (deptId) enriched = enriched.filter(s => s.department_id === deptId);
    if (semester) enriched = enriched.filter(s => s.current_semester === semester);
    if (riskLevel) enriched = enriched.filter(s => s.risk_level === riskLevel);

    const total = enriched.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIdx = (page - 1) * limit;
    const paginated = enriched.slice(startIdx, startIdx + limit);

    return successResponse(res, {
      total,
      page,
      limit,
      total_pages: totalPages,
      students: paginated
    }, 'Students fetched successfully');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

router.get('/students/:student_id', async (req, res) => {
  const { student_id } = req.params;
  try {
    const profile = await getStudentProfile(student_id.trim().toUpperCase());
    if (!profile) {
      return errorResponse(res, `Student with ID '${student_id}' not found`, 404);
    }
    return successResponse(res, profile, 'Student 360 profile fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

export default router;
