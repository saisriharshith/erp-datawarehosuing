/**
 * Pure JavaScript Synthetic ERP Data Generator
 * --------------------------------------------
 * Generates raw realistic institutional data across 5 engineering departments,
 * 61 courses, 30 faculty, and 600+ students with realistic variance and controlled anomalies.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEPARTMENTS_CONFIG = [
  {
    dept_id: "DEPT_CSE",
    name: "Computer Science & Engineering",
    short_code: "CSE",
    hod: "Dr. R. Ramanujan",
    intake: 180,
    established: 2002,
    raw_synonyms: ["CSE", "Computer Science", "Comp Sci", "CS", "CSE Dept"]
  },
  {
    dept_id: "DEPT_ECE",
    name: "Electronics & Communication Engineering",
    short_code: "ECE",
    hod: "Dr. Meenakshi Sundaram",
    intake: 140,
    established: 2004,
    raw_synonyms: ["ECE", "Electronics", "ECE Dept", "ECE Engg", "Electronics & Comm"]
  },
  {
    dept_id: "DEPT_MECH",
    name: "Mechanical Engineering",
    short_code: "MECH",
    hod: "Dr. K. Vikram",
    intake: 120,
    established: 2001,
    raw_synonyms: ["MECH", "Mechanical", "Mech Dept", "Mechanical Engg", "Mech"]
  },
  {
    dept_id: "DEPT_CIVIL",
    name: "Civil Engineering",
    short_code: "CIVIL",
    hod: "Dr. S. Ananth",
    intake: 100,
    established: 2003,
    raw_synonyms: ["Civil", "CIVIL", "Civil Engg", "civil", "Civil Dept"]
  },
  {
    dept_id: "DEPT_AIDS",
    name: "Artificial Intelligence & Data Science",
    short_code: "AI&DS",
    hod: "Dr. Priya Venkatesh",
    intake: 120,
    established: 2021,
    raw_synonyms: ["AI & DS", "AIDS", "AI-DS", "Data Science", "Artificial Intelligence"]
  }
];

export const SUBJECT_TEMPLATES = {
  "DEPT_CSE": [
    { code: "CS101", title: "Programming in Python", sem: 1, credits: 4 },
    { code: "MA101", title: "Engineering Mathematics I", sem: 1, credits: 4 },
    { code: "PH101", title: "Engineering Physics", sem: 1, credits: 3 },
    { code: "CS201", title: "Data Structures & Algorithms", sem: 2, credits: 4 },
    { code: "MA201", title: "Discrete Mathematics", sem: 2, credits: 4 },
    { code: "CS202", title: "Digital Logic & Computer Design", sem: 2, credits: 3 },
    { code: "CS301", title: "Computer Organization & Architecture", sem: 3, credits: 3 },
    { code: "CS302", title: "Object Oriented Programming in Java", sem: 3, credits: 4 },
    { code: "CS401", title: "Database Management Systems", sem: 4, credits: 4 },
    { code: "CS402", title: "Design & Analysis of Algorithms", sem: 4, credits: 4 },
    { code: "CS501", title: "Operating Systems", sem: 5, credits: 4 },
    { code: "CS502", title: "Computer Networks", sem: 5, credits: 4 },
    { code: "CS503", title: "Software Engineering & Agile", sem: 5, credits: 3 },
    { code: "CS601", title: "Web Technologies & Fullstack", sem: 6, credits: 3 },
    { code: "CS602", title: "Compiler Design", sem: 6, credits: 4 },
    { code: "CS701", title: "Cloud Computing & Distributed Systems", sem: 7, credits: 3 },
    { code: "CS801", title: "Information Security & Cryptography", sem: 8, credits: 3 }
  ],
  "DEPT_ECE": [
    { code: "EC101", title: "Basic Electrical & Electronics", sem: 1, credits: 4 },
    { code: "MA101", title: "Engineering Mathematics I", sem: 1, credits: 4 },
    { code: "EC201", title: "Electronic Circuits & Devices", sem: 2, credits: 4 },
    { code: "EC202", title: "Network Analysis & Synthesis", sem: 2, credits: 3 },
    { code: "EC301", title: "Signals & Systems", sem: 3, credits: 4 },
    { code: "EC302", title: "Electromagnetic Fields", sem: 3, credits: 3 },
    { code: "EC401", title: "Analog Communication Systems", sem: 4, credits: 3 },
    { code: "EC402", title: "Linear Integrated Circuits", sem: 4, credits: 4 },
    { code: "EC501", title: "Digital Signal Processing", sem: 5, credits: 4 },
    { code: "EC502", title: "Microprocessors & Microcontrollers", sem: 5, credits: 4 },
    { code: "EC601", title: "VLSI Design & Embedded Systems", sem: 6, credits: 3 },
    { code: "EC701", title: "Wireless Communications & 5G", sem: 7, credits: 3 },
    { code: "EC801", title: "Radar & Satellite Systems", sem: 8, credits: 3 }
  ],
  "DEPT_MECH": [
    { code: "ME101", title: "Engineering Graphics & Design", sem: 1, credits: 4 },
    { code: "MA101", title: "Engineering Mathematics I", sem: 1, credits: 4 },
    { code: "ME201", title: "Engineering Mechanics", sem: 2, credits: 4 },
    { code: "ME202", title: "Material Science & Metallurgy", sem: 2, credits: 3 },
    { code: "ME301", title: "Thermodynamics & Heat Transfer", sem: 3, credits: 4 },
    { code: "ME401", title: "Fluid Mechanics & Machinery", sem: 4, credits: 4 },
    { code: "ME501", title: "Manufacturing Technology", sem: 5, credits: 4 },
    { code: "ME502", title: "Kinematics & Dynamics of Machinery", sem: 5, credits: 3 },
    { code: "ME601", title: "Heat & Mass Transfer", sem: 6, credits: 4 },
    { code: "ME701", title: "Automobile Engineering", sem: 7, credits: 3 },
    { code: "ME801", title: "Robotics & Automation Systems", sem: 8, credits: 3 }
  ],
  "DEPT_CIVIL": [
    { code: "CE101", title: "Basic Civil Engineering", sem: 1, credits: 4 },
    { code: "MA101", title: "Engineering Mathematics I", sem: 1, credits: 4 },
    { code: "CE201", title: "Surveying & Geomatics", sem: 2, credits: 4 },
    { code: "CE301", title: "Strength of Materials", sem: 3, credits: 4 },
    { code: "CE401", title: "Building Construction & Materials", sem: 4, credits: 3 },
    { code: "CE501", title: "Structural Analysis I", sem: 5, credits: 4 },
    { code: "CE502", title: "Geotechnical Engineering", sem: 5, credits: 4 },
    { code: "CE601", "title": "Environmental Engineering", sem: 6, credits: 3 },
    { code: "CE701", "title": "Transportation Engineering", sem: 7, credits: 3 },
    { code: "CE801", "title": "Estimation & Costing", sem: 8, credits: 3 }
  ],
  "DEPT_AIDS": [
    { code: "AD101", title: "Foundations of Data Science", sem: 1, credits: 4 },
    { code: "MA101", title: "Engineering Mathematics I", sem: 1, credits: 4 },
    { code: "AD201", title: "Data Structures & Python for AI", sem: 2, credits: 4 },
    { code: "AD301", title: "Statistical Methods for AI", sem: 3, credits: 4 },
    { code: "AD401", title: "Applied Machine Learning", sem: 4, credits: 4 },
    { code: "AD501", title: "Deep Learning & Neural Networks", sem: 5, credits: 4 },
    { code: "AD502", title: "Big Data Analytics & Spark", sem: 5, credits: 3 },
    { code: "AD601", title: "Natural Language Processing", sem: 6, credits: 3 },
    { code: "AD701", title: "Computer Vision & Generative AI", sem: 7, credits: 3 },
    { code: "AD801", title: "AI Ethics, Governance & MLOps", sem: 8, credits: 3 }
  ]
};

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
  "Shaurya", "Atharva", "Advik", "Pranav", "Advaith", "Kabir", "Ananya", "Diya", "Saanvi", "Aadhya",
  "Pari", "Anika", "Navya", "Riya", "Sneha", "Pooja", "Tanvi", "Kavya", "Divya", "Swati"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Reddy", "Rao", "Nair", "Iyer", "Gupta", "Singh", "Kumar",
  "Mishra", "Joshi", "Bose", "Das", "Choudhury", "Deshmukh", "Pillai", "Menon", "Bhat", "Hegde"
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateSyntheticERPData(numStudents = 600) {
  console.log(`Generating synthetic ERP dataset in JavaScript for ${numStudents} students...`);

  // 1. Departments
  const rawDepartments = DEPARTMENTS_CONFIG.map(d => ({
    code: d.dept_id,
    dept_name: d.name,
    short_name: d.short_code,
    hod_incharge: d.hod,
    intake_capacity: d.intake,
    est_year: d.established
  }));

  // 2. Subjects
  const rawSubjects = [];
  Object.entries(SUBJECT_TEMPLATES).forEach(([deptId, subs]) => {
    subs.forEach(s => {
      rawSubjects.push({
        sub_code: s.code,
        title: s.title,
        dept_code: deptId,
        semester: s.sem,
        credits: s.credits,
        is_active: true
      });
    });
  });

  // 3. Faculty
  const rawFaculty = [];
  let facCounter = 100;
  DEPARTMENTS_CONFIG.forEach(dept => {
    for (let i = 0; i < 6; i++) {
      facCounter++;
      const fname = randomChoice(FIRST_NAMES);
      const lname = randomChoice(LAST_NAMES);
      const desig = i === 0 ? 'Professor & HOD' : (i < 3 ? 'Associate Professor' : 'Assistant Professor');
      rawFaculty.push({
        fac_id: `FAC${facCounter}`,
        faculty_name: `Dr. ${fname} ${lname}`,
        assigned_dept: randomChoice(dept.raw_synonyms),
        designation: desig,
        experience_years: randomInt(4, 25),
        email: `${fname.toLowerCase()}.${lname.toLowerCase()}@univ.edu`,
        workload_hours_per_week: randomInt(12, 20)
      });
    }
  });

  // 4. Students & Admissions
  const rawStudents = [];
  const rawAdmissions = [];
  const studentMetaMap = {};

  const batches = [2021, 2022, 2023, 2024];
  const quotas = ["Merit", "Merit", "Merit", "Management", "Sports", "NRI"];

  for (let i = 1; i <= numStudents; i++) {
    const batch = randomChoice(batches);
    const stuId = `STU${batch}${String(i).padStart(4, '0')}`;
    const fname = randomChoice(FIRST_NAMES);
    const lname = randomChoice(LAST_NAMES);
    const gender = ["Ananya", "Diya", "Saanvi", "Aadhya", "Pari", "Anika", "Navya", "Riya", "Sneha", "Pooja", "Tanvi", "Kavya", "Divya", "Swati"].includes(fname) ? "Female" : "Male";
    const deptObj = randomChoice(DEPARTMENTS_CONFIG);
    const currentSem = Math.min(8, Math.max(1, (2025 - batch) * 2 - (Math.random() < 0.3 ? 1 : 0)));
    const quota = randomChoice(quotas);
    const rank = quota === "Merit" ? randomInt(500, 45000) : randomInt(40000, 95000);

    const email = Math.random() < 0.04 ? null : `${fname.toLowerCase()}.${lname.toLowerCase()}${randomInt(10, 99)}@example.com`;

    rawStudents.push({
      raw_student_id: stuId,
      first_name: fname,
      last_name: lname,
      gender,
      date_of_birth: `${batch - 18}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
      contact_email: email,
      contact_phone: `+91-${randomInt(7000000000, 9999999999)}`,
      department: randomChoice(deptObj.raw_synonyms),
      admission_batch: batch,
      current_term: currentSem,
      status: "Enrolled",
      created_timestamp: new Date().toISOString()
    });

    rawAdmissions.push({
      adm_id: `ADM_${batch}_${String(i).padStart(4, '0')}`,
      student_ref: stuId,
      entry_category: quota,
      merit_score_rank: rank,
      allocated_branch: deptObj.dept_id,
      admission_date: `${batch}-07-15`,
      scholarship_granted: quota === "Merit" && rank < 5000
    });

    studentMetaMap[stuId] = {
      stu_id: stuId,
      dept_id: deptObj.dept_id,
      semester: currentSem,
      batch,
      quota,
      ability: 0.45 + Math.random() * 0.50
    };
  }

  // Intentional duplicates (~3%)
  const dupCount = Math.floor(numStudents * 0.03);
  for (let d = 0; d < dupCount; d++) {
    const clone = { ...randomChoice(rawStudents) };
    clone.created_timestamp = new Date(Date.now() + 60000).toISOString();
    rawStudents.push(clone);
  }

  // 5. Attendance Facts
  const rawAttendance = [];
  let attCounter = 1;

  Object.values(studentMetaMap).forEach(meta => {
    const subs = (SUBJECT_TEMPLATES[meta.dept_id] || []).filter(s => s.sem <= meta.semester);
    subs.forEach(sub => {
      attCounter++;
      const total = randomChoice([50, 54, 60, 64]);
      const attRate = Math.min(0.98, Math.max(0.40, meta.ability + (Math.random() * 0.40 - 0.25)));
      let attended = Math.floor(total * attRate);

      // 2% out-of-range anomaly
      const anom = Math.random();
      if (anom < 0.015) attended = total + randomInt(2, 8);
      else if (anom < 0.025) attended = -randomInt(1, 3);

      rawAttendance.push({
        att_record_id: `ATT_${meta.batch}_${String(attCounter).padStart(6, '0')}`,
        student_id: meta.stu_id,
        subject_code: sub.code,
        dept_id: meta.dept_id,
        semester: sub.sem,
        academic_year: `${meta.batch + Math.floor((sub.sem - 1) / 2)}-${meta.batch + Math.floor((sub.sem - 1) / 2) + 1}`,
        total_conducted: total,
        attended_count: attended,
        last_recorded_date: `2024-${String(randomInt(9, 11)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`
      });
    });
  });

  // 6. Examination Facts
  const rawExaminations = [];
  let examCounter = 1;

  Object.values(studentMetaMap).forEach(meta => {
    const subs = (SUBJECT_TEMPLATES[meta.dept_id] || []).filter(s => s.sem <= meta.semester);
    subs.forEach(sub => {
      examCounter++;
      let rawInternal = Math.floor(30 * Math.min(0.98, Math.max(0.30, meta.ability + (Math.random() * 0.35 - 0.20))));
      let rawEndsem = Math.floor(70 * Math.min(0.98, Math.max(0.25, meta.ability + (Math.random() * 0.37 - 0.22))));

      if (Math.random() < 0.01) rawEndsem = 85;
      else if (Math.random() < 0.02) rawInternal = -5;

      rawExaminations.push({
        exam_record_id: `EXM_${meta.batch}_${String(examCounter).padStart(6, '0')}`,
        student_id: meta.stu_id,
        subject_code: sub.code,
        semester: sub.sem,
        dept_code: meta.dept_id,
        academic_year: `${meta.batch + Math.floor((sub.sem - 1) / 2)}-${meta.batch + Math.floor((sub.sem - 1) / 2) + 1}`,
        internal_marks_scored: rawInternal,
        internal_marks_max: 30,
        end_semester_marks_scored: rawEndsem,
        end_semester_marks_max: 70,
        exam_session: sub.sem % 2 === 1 ? "Nov-Dec" : "Apr-May"
      });
    });
  });

  // 7. Fee Billing & Transactions
  const rawFees = [];
  let feeCounter = 1;

  Object.values(studentMetaMap).forEach(meta => {
    for (let s = 1; s <= meta.semester; s++) {
      feeCounter++;
      const isMgmt = meta.quota === "Management" || meta.quota === "NRI";
      const totalDue = isMgmt ? 125000.0 : 65000.0;
      const isPaid = Math.random() < 0.88;
      const totalPaid = isPaid ? totalDue : (Math.random() < 0.5 ? totalDue * 0.5 : 0.0);

      rawFees.push({
        transaction_id: `TXN_${meta.batch}_${String(feeCounter).padStart(6, '0')}`,
        student_identifier: meta.stu_id,
        semester_term: s,
        fee_structure_total: totalDue,
        amount_remitted: totalPaid,
        receipt_date: `2024-${String(randomInt(1, 6)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
        payment_mode: randomChoice(["NEFT", "UPI", "Credit Card", "Bank Challan", "Online Gateway"])
      });
    }
  });

  // 8. Library Circulation Facts
  const rawLibrary = Object.values(studentMetaMap).map(meta => {
    const usage = Math.floor(meta.ability * 8 + randomInt(0, 4));
    const active = Math.min(3, Math.floor(usage / 3));
    const overdue = Math.random() < 0.15 ? 1 : 0;
    return {
      lib_card_id: `LIB_${meta.stu_id}`,
      student_id: meta.stu_id,
      lifetime_issues_count: usage,
      current_active_loans: active,
      overdue_items_count: overdue,
      fine_dues_amount: overdue * randomChoice([50, 100, 150, 200])
    };
  });

  return {
    departments: rawDepartments,
    subjects: rawSubjects,
    faculty: rawFaculty,
    students: rawStudents,
    admissions: rawAdmissions,
    attendance: rawAttendance,
    examinations: rawExaminations,
    fees: rawFees,
    library: rawLibrary
  };
}
