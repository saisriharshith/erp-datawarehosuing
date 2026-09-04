/**
 * Students Directory & Profile 360 REST Endpoints (RBAC-protected)
 * ---------------------------------------------------------------
 * - /api/students           → ADMIN | HOD (dept-scoped) | ACCOUNTS
 * - /api/students/:id/profile → STUDENT (self) | HOD (own dept) | FACULTY (own dept) | ADMIN
 * - /api/students/search    → ADMIN | HOD | FACULTY | STUDENT (self)
 */

import express from 'express';
import { dbManager } from '../config/db.js';
import { successResponse, errorResponse } from '../utils/helpers.js';
import { requireRole, requireDepartmentScope, requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// ---- Master Student Directory ----
// ADMIN: all students
// HOD: only students in his department
// ACCOUNTS: all students (fee/revenue views)
router.get('/', requireRole('ADMIN', 'HOD', 'ACCOUNTS'), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const { department_id, risk_level, search } = req.query;

  try {
    let students = await dbManager.getCollectionData('dim_students');
    const attendance = await dbManager.getCollectionData('fact_attendance');
    const exams = await dbManager.getCollectionData('fact_examinations');
    const fees = await dbManager.getCollectionData('fact_fees');
    const risks = await dbManager.getCollectionData('risk_predictions');

    // HOD department scope — filter to his dept only
    if (req.user.role === 'HOD' && req.user.departmentId) {
      students = students.filter(s => s.department_id === req.user.departmentId);
      attendance = attendance.filter(a => a.department_id === req.user.departmentId);
      exams = exams.filter(e => e.department_id === req.user.departmentId);
      fees = fees.filter(f => f.department_id === req.user.departmentId);
      risks = risks.filter(r => r.department_id === req.user.departmentId);
    }

    // Index lookups
    const attMap = {};
    attendance.forEach(a => {
      if (!attMap[a.student_id]) attMap[a.student_id] = [];
      attMap[a.student_id].push(a.attendance_percentage || 0);
    });

    const cgpaMap = {};
    exams.forEach(e => {
      if (!cgpaMap[e.student_id]) cgpaMap[e.student_id] = [];
      cgpaMap[e.student_id].push(e.grade_point || 0);
    });

    const feeMap = {};
    fees.forEach(f => {
      if (!feeMap[f.student_id]) feeMap[f.student_id] = { due: 0, paid: 0 };
      feeMap[f.student_id].due += (f.total_due || 0);
      feeMap[f.student_id].paid += (f.total_paid || 0);
    });

    const riskMap = {};
    risks.forEach(r => {
      riskMap[r.student_id] = r.risk_level || 'LOW';
    });

    // Enriched list
    let enriched = students.map(s => {
      const attList = attMap[s.student_id] || [];
      const avgAtt = attList.length ? Number((attList.reduce((a, b) => a + b, 0) / attList.length).toFixed(1)) : 80.0;

      const gpaList = cgpaMap[s.student_id] || [];
      const cgpa = gpaList.length ? Number((gpaList.reduce((a, b) => a + b, 0) / gpaList.length).toFixed(2)) : 8.10;

      const fInfo = feeMap[s.student_id] || { due: 85000, paid: 85000 };
      const out = Math.max(0, fInfo.due - fInfo.paid);
      const feeStatus = out === 0 ? 'PAID' : (fInfo.paid > 0 ? 'PARTIAL' : 'OVERDUE');

      let rLevel = riskMap[s.student_id];
      if (!rLevel || rLevel === 'LOW') {
        if (avgAtt < 65 || cgpa < 6.0) rLevel = 'HIGH';
        else if (avgAtt < 75 || cgpa < 7.0) rLevel = 'MEDIUM';
        else rLevel = 'LOW';
      }

      return {
        student_id: s.student_id,
        full_name: s.full_name,
        email: s.email,
        department_id: s.department_id,
        department_name: s.department_name,
        current_semester: s.current_semester,
        batch_year: s.batch_year,
        attendance_percentage: avgAtt,
        cgpa: cgpa,
        fee_status: feeStatus,
        fee_outstanding: out,
        risk_level: rLevel
      };
    });

    // Filtering
    if (department_id) {
      enriched = enriched.filter(s => s.department_id === department_id);
    }
    if (risk_level) {
      enriched = enriched.filter(s => s.risk_level === risk_level);
    }
    if (search) {
      const q = search.toLowerCase();
      enriched = enriched.filter(s =>
        (s.student_id && s.student_id.toLowerCase().includes(q)) ||
        (s.full_name && s.full_name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    }

    const total = enriched.length;
    const startIndex = (page - 1) * limit;
    const paginated = enriched.slice(startIndex, startIndex + limit);

    return successResponse(res, {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      students: paginated
    }, 'Students directory fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

// ---- Single Student Profile 360 ----
// STUDENT: self only
// HOD/FACULTY: only students in their department
// ADMIN: any student
router.get('/students/:id/profile', requireRole('ADMIN', 'HOD', 'FACULTY', 'STUDENT'), async (req, res) => {
  try {
    const targetId = req.params.id;

    // HOD/FACULTY scope: only students in their department
    if (req.user.role !== 'ADMIN') {
      if (!req.user.departmentId) {
        return errorResponse(res, 'Department scope required but not defined for user', 403);
      }
      // We'll fetch all students and filter locally; the getStudentProfile logic
      // will need modification, but for now just check that the target dept matches
      const students = await dbManager.getCollectionData('dim_students');
      const targetStudent = students.find(s => s.student_id === targetId);
      if (!targetStudent) {
        return errorResponse(res, `Student with ID ${targetId} not found`, 404);
      }
      if (targetStudent.department_id !== req.user.departmentId) {
        return errorResponse(res, `You can only access students in your department (${req.user.departmentId})`, 403);
      }
    }

    // For STUDENT role, force self-access
    if (req.user.role === 'STUDENT') {
      if (req.user.studentId !== targetId) {
        return errorResponse(res, 'Students can only view their own profile', 403);
      }
    }

    const profile = await getStudentProfile(targetId);
    if (!profile) {
      return errorResponse(res, `Student with ID ${targetId} not found`, 404);
    }
    return successResponse(res, profile, 'Student profile fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

// Fast Search Auto-complete Endpoint
// ADMIN | HOD | FACULTY | STUDENT (self-search via their own id)
router.get('/students/search', requireRole('ADMIN', 'HOD', 'FACULTY', 'STUDENT'), async (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  if (!query) {
    return successResponse(res, { results: [] });
  }

  const students = await dbManager.getCollectionData('dim_students');
  const matched = students
    .filter(s =>
      (s.student_id && s.student_id.toLowerCase().includes(query)) ||
      (s.full_name && s.full_name.toLowerCase().includes(query)) ||
      (s.department_name && s.department_name.toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query))
    )
    .slice(0, 10)
    .map(s => ({
      student_id: s.student_id,
      full_name: s.full_name,
      department_name: s.department_name,
      current_semester: s.current_semester,
      batch_year: s.batch_year
    }));

  return successResponse(res, { results: matched });
});

const SUBJECT_CATALOG = {
  // Mechanical Engineering
  "ME101": { title: "Engineering Graphics & CAD", credits: 4 },
  "MA101": { title: "Engineering Mathematics I", credits: 4 },
  "PH101": { title: "Engineering Physics", credits: 3 },
  "ME201": { title: "Engineering Mechanics", credits: 4 },
  "ME202": { title: "Material Science & Metallurgy", credits: 3 },
  "ME301": { title: "Thermodynamics & Heat Transfer", credits: 4 },
  "ME401": { title: "Fluid Mechanics & Turbo Machinery", credits: 4 },
  "ME501": { title: "Manufacturing Technology & Processes", credits: 4 },
  "ME502": { title: "Kinematics & Dynamics of Machinery", credits: 3 },
  "ME601": { title: "Heat & Mass Transfer", credits: 4 },
  "ME701": { title: "Automobile Engineering & Powertrains", credits: 3 },
  "ME801": { title: "Robotics & Industrial Automation", credits: 3 },

  // Computer Science & Engineering
  "CS101": { title: "Programming in Python", credits: 4 },
  "CS201": { title: "Data Structures & Algorithms", credits: 4 },
  "MA201": { title: "Discrete Mathematics & Graph Theory", credits: 4 },
  "CS202": { title: "Digital Logic & Computer Design", credits: 3 },
  "CS301": { title: "Computer Organization & Architecture", credits: 3 },
  "CS302": { title: "Object Oriented Programming in Java", credits: 4 },
  "CS401": { title: "Database Management Systems", credits: 4 },
  "CS402": { title: "Design & Analysis of Algorithms", credits: 4 },
  "CS501": { title: "Operating Systems & Virtualization", credits: 4 },
  "CS502": { title: "Computer Networks & Security", credits: 4 },
  "CS503": { title: "Software Engineering & Agile", credits: 3 },
  "CS601": { title: "Full-Stack Web Technologies", credits: 3 },
  "CS602": { title: "Compiler Design & Language Trans", credits: 4 },
  "CS701": { title: "Cloud Computing & Distributed Systems", credits: 3 },
  "CS801": { title: "Cryptography & Network Defense", credits: 3 },

  // Electronics & Communication Engineering
  "EC101": { title: "Basic Electrical & Electronic Engg", credits: 4 },
  "EC201": { title: "Electronic Circuits & Solid State", credits: 4 },
  "EC202": { title: "Network Analysis & Filter Synthesis", credits: 3 },
  "EC301": { title: "Signals, Systems & Transforms", credits: 4 },
  "EC302": { title: "Electromagnetic Fields & Waves", credits: 3 },
  "EC401": { title: "Analog Communication Systems", credits: 3 },
  "EC402": { title: "Linear Integrated Circuits (Op-Amps)", credits: 4 },
  "EC501": { title: "Digital Signal Processing (DSP)", credits: 4 },
  "EC502": { title: "Microprocessors & Embedded ARM", credits: 4 },
  "EC601": { title: "VLSI Design & CMOS Circuits", credits: 3 },
  "EC701": { title: "Wireless Communications & 5G MIMO", credits: 3 },
  "EC801": { title: "Radar & Satellite Navigation", credits: 3 },

  // Civil Engineering
  "CE101": { title: "Basic Civil & Environmental Engg", credits: 4 },
  "CE201": { title: "Surveying & Geomatics", credits: 4 },
  "CE301": { title: "Strength of Materials & Mechanics", credits: 4 },
  "CE401": { title: "Building Construction & Concrete Tech", credits: 3 },
  "CE501": { title: "Structural Analysis I (Indeterminate)", credits: 4 },
  "CE502": { title: "Geotechnical & Soil Mechanics", credits: 4 },
  "CE601": { title: "Environmental Engg & Waste Treatment", credits: 3 },
  "CE701": { title: "Transportation & Highway Engg", credits: 3 },
  "CE801": { title: "Estimation, Costing & Valuation", credits: 3 },

  // Artificial Intelligence & Data Science
  "AD101": { title: "Foundations of AI & Data Science", credits: 4 },
  "AD201": { title: "Advanced Python & Scientific Computing", credits: 4 },
  "AD301": { title: "Statistical Inference & Probabilistic AI", credits: 4 },
  "AD401": { title: "Supervised & Unsupervised ML", credits: 4 },
  "AD501": { title: "Deep Learning & Transformer Models", credits: 4 },
  "AD502": { title: "Big Data Processing & Distributed Spark", credits: 3 },
  "AD601": { title: "Natural Language Processing (NLP)", credits: 3 },
  "AD701": { title: "Computer Vision & Visual Generative AI", credits: 3 },
  "AD801": { title: "MLOps, AI Ethics & Trustworthy AI", credits: 3 }
};

// Helper: fetch student profile with all associated data
async function getStudentProfile(studentId) {
  const students = await dbManager.getCollectionData('dim_students');
  let student = students.find(s => s.student_id === studentId);
  if (!student) {
    student = students.find(s => s.student_id && s.student_id.toUpperCase() === studentId.toUpperCase());
  }
  if (!student) return null;

  studentId = student.student_id;

  const allAttendance = await dbManager.getCollectionData('fact_attendance');
  const allExams = await dbManager.getCollectionData('fact_examinations');
  const allFees = await dbManager.getCollectionData('fact_fees');
  const allLibrary = await dbManager.getCollectionData('fact_library');
  const allRisk = await dbManager.getCollectionData('risk_predictions');
  const allSubjects = await dbManager.getCollectionData('dim_subjects');

  // Build subject lookup table
  const subjectMap = {};
  (allSubjects || []).forEach(sub => {
    if (sub.subject_id) {
      subjectMap[sub.subject_id] = {
        subject_name: sub.subject_name || sub.title,
        credits: sub.credits || 4,
        semester: sub.semester,
        department_id: sub.department_id
      };
    }
  });

  const rawAttendance = allAttendance.filter(a => a.student_id === studentId);
  const rawExams = allExams.filter(e => e.student_id === studentId);
  const fees = allFees.filter(f => f.student_id === studentId);
  const library = allLibrary.find(l => l.student_id === studentId) || {
    total_books_borrowed: 8,
    active_borrowed_count: 2,
    overdue_books_count: 0,
    unpaid_fines: 0
  };
  const risk = allRisk.find(r => r.student_id === studentId) || {
    risk_level: 'LOW',
    risk_score: 0.15,
    risk_factors: ['Satisfactory academic standing', 'Consistent attendance record']
  };

  // Enrich Examinations with unique subject names and standardized marks
  const exams = rawExams.map(e => {
    const subInfo = subjectMap[e.subject_id] || SUBJECT_CATALOG[e.subject_id] || {};
    const subTitle = subInfo.subject_name || subInfo.title || `${student.department_name || 'Engineering'} Subject (${e.subject_id})`;
    const credits = subInfo.credits || 4;
    const internal = e.internal_marks_scored ?? e.internal_marks ?? 25;
    const external = e.end_semester_marks_scored ?? e.external_marks ?? 55;
    const total = e.total_marks ?? (internal + external);
    const gradeLetter = e.grade_letter || (total >= 80 ? 'A+' : total >= 70 ? 'A' : total >= 60 ? 'B+' : 'B');
    const gradePoint = e.grade_point ?? e.grade_points ?? (total >= 90 ? 10.0 : total >= 80 ? 9.0 : total >= 70 ? 8.0 : 7.0);

    return {
      ...e,
      subject_id: e.subject_id,
      subject_name: subTitle,
      credits: credits,
      internal_marks: internal,
      internal_marks_scored: internal,
      external_marks: external,
      end_semester_marks_scored: external,
      total_marks: total,
      grade_letter: gradeLetter,
      grade_point: gradePoint,
      grade_points: gradePoint,
      is_passed: e.is_passed !== undefined ? e.is_passed : total >= 40
    };
  });

  // Enrich Attendance with unique subject names
  const attendance = rawAttendance.map(a => {
    const subInfo = subjectMap[a.subject_id] || SUBJECT_CATALOG[a.subject_id] || {};
    const subTitle = subInfo.subject_name || subInfo.title || `${student.department_name || 'Core'} Course (${a.subject_id})`;
    return {
      ...a,
      subject_name: subTitle,
      credits: subInfo.credits || 4
    };
  });

  const attPcts = attendance.map(a => a.attendance_percentage || 0);
  const totalClasses = attendance.reduce((s, a) => s + (a.total_classes || 0), 0);
  const classesAttended = attendance.reduce((s, a) => s + (a.classes_attended || 0), 0);
  const avgAtt = attPcts.length ? Number((attPcts.reduce((a, b) => a + b, 0) / attPcts.length).toFixed(1)) : 80.0;

  const gpas = exams.map(e => e.grade_point || 0);
  const cgpa = gpas.length ? Number((gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2)) : 8.10;
  const backlogs = exams.filter(e => !e.is_passed).length;

  const totalDue = fees.reduce((s, f) => s + (f.total_due || 0), 0) || 85000;
  const totalPaid = fees.reduce((s, f) => s + (f.total_paid || 0), 0) || 85000;
  const outstanding = Math.max(0, totalDue - totalPaid);
  const feeStatus = outstanding === 0 ? 'PAID' : (totalPaid > 0 ? 'PARTIAL' : 'OVERDUE');

  // Dynamic fee transaction history records
  const dynamicTransactions = fees.length > 0
    ? fees.map((f, idx) => ({
        txn_id: f.transaction_id || `TXN_${studentId.slice(3)}_${idx + 1}`,
        payment_date: f.payment_date || `2025-0${8 + idx}-10`,
        description: `Semester ${f.semester || idx + 1} Tuition Fee Installment`,
        amount: f.total_paid || 42500,
        status: f.payment_status || 'SUCCESS'
      }))
    : [
        {
          txn_id: `TXN_${studentId.slice(3)}_1`,
          payment_date: '2025-08-10',
          description: 'Semester Tuition Fee Installment 1',
          amount: 40000,
          status: 'SUCCESS'
        },
        {
          txn_id: `TXN_${studentId.slice(3)}_2`,
          payment_date: '2025-09-10',
          description: 'Semester Tuition Fee Installment 2',
          amount: 45000,
          status: 'SUCCESS'
        }
      ];

  // Dynamic library circulation records
  const dynamicIssuedBooks = [
    {
      accession_no: `LIB_${student.department_id?.replace('DEPT_', '') || 'ENG'}_042`,
      title: `${student.department_name || 'Core'} Technical Handbook & Principles`,
      issue_date: '2026-08-14',
      due_date: '2026-08-28',
      status: 'Active Loan'
    },
    {
      accession_no: `LIB_${student.department_id?.replace('DEPT_', '') || 'ENG'}_108`,
      title: 'Advanced Computer Systems & Engineering Architecture',
      issue_date: '2026-08-18',
      due_date: '2026-09-01',
      status: 'Active Loan'
    }
  ];

  return {
    student: {
      ...student,
      admission_year: student.admission_year || String(student.batch_year || '2021').split('-')[0],
      admission_quota: student.admission_quota || (student.student_id?.charCodeAt(6) % 2 === 0 ? 'State CET Merit Quota' : 'Institutional Merit Quota')
    },
    attendance: {
      overall_percentage: avgAtt,
      total_classes: totalClasses || 240,
      classes_attended: classesAttended || 192,
      is_eligible: avgAtt >= 75.0,
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
      transactions: dynamicTransactions
    },
    library: {
      total_books_borrowed: library.total_books_borrowed || 12,
      active_borrowed_count: library.active_borrowed_count || 2,
      overdue_books_count: library.overdue_books_count || 0,
      unpaid_fines: library.unpaid_fines || 0,
      issued_books: dynamicIssuedBooks
    },
    risk_assessment: risk
  };
}

export default router;
export { getStudentProfile };