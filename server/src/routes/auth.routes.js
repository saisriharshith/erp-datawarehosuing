/**
 * Authentication & Role-Based Access Control Routes (22 Demo Accounts)
 * ---------------------------------------------------------------------
 * Real accounts mapped to verified dim_faculty & dim_students records.
 */

import express from 'express';
import crypto from 'crypto';
import { successResponse, errorResponse } from '../utils/helpers.js';

const router = express.Router();

const DEMO_PASSWORD_HASH = crypto.createHash('sha256').update('demo1234').digest('hex');

export const DEMO_USERS = {
  // 1. ADMIN / EXECUTIVE ACCOUNTS (2)
  "admin@univ.edu": {
    user_id: "USR_ADMIN_01",
    email: "admin@univ.edu",
    name: "Dr. Sarah Jenkins (Dean of Academic Affairs)",
    role: "ADMIN",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["all", "data_quality", "risk_intervention", "etl_trigger"]
  },
  "provost@univ.edu": {
    user_id: "USR_ADMIN_02",
    email: "provost@univ.edu",
    name: "Prof. Arthur Pendelton (University Provost)",
    role: "ADMIN",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["all", "data_quality", "risk_intervention", "etl_trigger"]
  },

  // 2. FACULTY & DEPARTMENT HOD ACCOUNTS (8) — mapped to real dim_faculty records
  "faculty@univ.edu": {
    user_id: "FAC101",
    faculty_id: "FAC101",
    email: "faculty@univ.edu",
    name: "Dr. Rajeshwar Rao (Senior Professor, CSE)",
    role: "FACULTY",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },
  "cse.hod@univ.edu": {
    user_id: "FAC102",
    faculty_id: "FAC102",
    email: "cse.hod@univ.edu",
    name: "Dr. Sunita Deshmukh (Professor & CSE HOD)",
    role: "FACULTY",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },
  "ece.hod@univ.edu": {
    user_id: "FAC107",
    faculty_id: "FAC107",
    email: "ece.hod@univ.edu",
    name: "Dr. Rajeshwar Rao (Professor & ECE HOD)",
    role: "FACULTY",
    department_id: "DEPT_ECE",
    department_name: "Electronics & Communication Engineering",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },
  "mech.hod@univ.edu": {
    user_id: "FAC113",
    faculty_id: "FAC113",
    email: "mech.hod@univ.edu",
    name: "Dr. Rajeshwar Rao (Professor & Mechanical HOD)",
    role: "FACULTY",
    department_id: "DEPT_MECH",
    department_name: "Mechanical Engineering",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },
  "civil.hod@univ.edu": {
    user_id: "FAC119",
    faculty_id: "FAC119",
    email: "civil.hod@univ.edu",
    name: "Dr. Rajeshwar Rao (Professor & Civil HOD)",
    role: "FACULTY",
    department_id: "DEPT_CIVIL",
    department_name: "Civil Engineering",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },
  "aids.hod@univ.edu": {
    user_id: "FAC125",
    faculty_id: "FAC125",
    email: "aids.hod@univ.edu",
    name: "Dr. Rajeshwar Rao (Professor & AI & Data Science HOD)",
    role: "FACULTY",
    department_id: "DEPT_AIDS",
    department_name: "Artificial Intelligence & Data Science",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },
  "prof.sharma@univ.edu": {
    user_id: "FAC103",
    faculty_id: "FAC103",
    email: "prof.sharma@univ.edu",
    name: "Dr. Amitabha Bose (Associate Professor, CSE)",
    role: "FACULTY",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },
  "prof.reddy@univ.edu": {
    user_id: "FAC111",
    faculty_id: "FAC111",
    email: "prof.reddy@univ.edu",
    name: "Mr. Senthil Kumar (Assistant Professor, ECE)",
    role: "FACULTY",
    department_id: "DEPT_ECE",
    department_name: "Electronics & Communication Engineering",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },

  // 3. ACCOUNTS & FINANCE OFFICER ACCOUNTS (2)
  "accounts@univ.edu": {
    user_id: "USR_ACC_01",
    email: "accounts@univ.edu",
    name: "Mr. S. K. Sharma (Chief Accounts Officer / Bursar)",
    role: "ACCOUNTS",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["fee_management", "revenue_analytics", "offline_receipting", "reminders"]
  },
  "bursar@univ.edu": {
    user_id: "USR_ACC_02",
    email: "bursar@univ.edu",
    name: "Mrs. Anita Roy (Senior Finance Officer)",
    role: "ACCOUNTS",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["fee_management", "revenue_analytics", "offline_receipting"]
  },

  // 4. STUDENT ACCOUNTS (10) — mapped to verified real dim_students records
  "student@univ.edu": {
    user_id: "STU20220001",
    email: "student@univ.edu",
    name: "Sai Gupta (CSE Student)",
    role: "STUDENT",
    student_id: "STU20220001",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    semester: 1,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "sai@univ.edu": {
    user_id: "STU20220001",
    email: "sai@univ.edu",
    name: "Sai Gupta (STU20220001)",
    role: "STUDENT",
    student_id: "STU20220001",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    semester: 1,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "aadhya@univ.edu": {
    user_id: "STU20230002",
    email: "aadhya@univ.edu",
    name: "Aadhya Nair (STU20230002)",
    role: "STUDENT",
    student_id: "STU20230002",
    department_id: "DEPT_CIVIL",
    department_name: "Civil Engineering",
    semester: 1,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "swati@univ.edu": {
    user_id: "STU20240003",
    email: "swati@univ.edu",
    name: "Swati Bose (STU20240003)",
    role: "STUDENT",
    student_id: "STU20240003",
    department_id: "DEPT_CIVIL",
    department_name: "Civil Engineering",
    semester: 5,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "vihaan@univ.edu": {
    user_id: "STU20210004",
    email: "vihaan@univ.edu",
    name: "Vihaan Reddy (STU20210004)",
    role: "STUDENT",
    student_id: "STU20210004",
    department_id: "DEPT_ECE",
    department_name: "Electronics & Communication Engineering",
    semester: 6,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "nikhil@univ.edu": {
    user_id: "STU20220005",
    email: "nikhil@univ.edu",
    name: "Nikhil Singh (STU20220005)",
    role: "STUDENT",
    student_id: "STU20220005",
    department_id: "DEPT_MECH",
    department_name: "Mechanical Engineering",
    semester: 7,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "meera@univ.edu": {
    user_id: "STU20230006",
    email: "meera@univ.edu",
    name: "Meera Iyer (STU20230006)",
    role: "STUDENT",
    student_id: "STU20230006",
    department_id: "DEPT_ECE",
    department_name: "Electronics & Communication Engineering",
    semester: 4,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "vikram@univ.edu": {
    user_id: "STU20240007",
    email: "vikram@univ.edu",
    name: "Vikram Patel (STU20240007)",
    role: "STUDENT",
    student_id: "STU20240007",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    semester: 2,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "ananya@univ.edu": {
    user_id: "STU20210008",
    email: "ananya@univ.edu",
    name: "Ananya Kumar (STU20210008)",
    role: "STUDENT",
    student_id: "STU20210008",
    department_id: "DEPT_CIVIL",
    department_name: "Civil Engineering",
    semester: 4,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "aditya@univ.edu": {
    user_id: "STU20220009",
    email: "aditya@univ.edu",
    name: "Aditya Das (STU20220009)",
    role: "STUDENT",
    student_id: "STU20220009",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    semester: 5,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "varun@univ.edu": {
    user_id: "STU20230010",
    email: "varun@univ.edu",
    name: "Varun Joshi (STU20230010)",
    role: "STUDENT",
    student_id: "STU20230010",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    semester: 7,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  }
};

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return errorResponse(res, 'Email and password are required', 400);
  }

  const user = DEMO_USERS[email.toLowerCase()];
  if (!user) {
    return errorResponse(res, 'Invalid user credentials', 401);
  }

  const reqHash = crypto.createHash('sha256').update(password).digest('hex');
  if (reqHash !== user.password_hash) {
    return errorResponse(res, 'Invalid user credentials', 401);
  }

  const token = `jwt_mock_${user.role.toLowerCase()}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

  const responsePayload = {
    user_id: user.user_id,
    faculty_id: user.faculty_id || null,
    student_id: user.student_id || null,
    name: user.name,
    email: user.email,
    role: user.role,
    department_id: user.department_id || null,
    department_name: user.department_name || null,
    semester: user.semester || null,
    permissions: user.permissions,
    token
  };

  return successResponse(res, responsePayload, 'User authentication successful');
});

export default router;
