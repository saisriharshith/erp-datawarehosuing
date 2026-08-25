/**
 * Authentication & Role-Based Access Control Routes (20 Demo Accounts)
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

  // 2. FACULTY & DEPARTMENT HOD ACCOUNTS (8)
  "faculty@univ.edu": {
    user_id: "FAC101",
    email: "faculty@univ.edu",
    name: "Prof. Rajeshwar Rao (CSE Senior Faculty)",
    role: "FACULTY",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },
  "cse.hod@univ.edu": {
    user_id: "FAC101",
    email: "cse.hod@univ.edu",
    name: "Dr. R. Ramanujan (Professor & CSE HOD)",
    role: "FACULTY",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },
  "ece.hod@univ.edu": {
    user_id: "FAC102",
    email: "ece.hod@univ.edu",
    name: "Dr. Meenakshi Sundaram (ECE HOD)",
    role: "FACULTY",
    department_id: "DEPT_ECE",
    department_name: "Electronics & Communication Engineering",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },
  "mech.hod@univ.edu": {
    user_id: "FAC103",
    email: "mech.hod@univ.edu",
    name: "Dr. K. Vikram (Mechanical HOD)",
    role: "FACULTY",
    department_id: "DEPT_MECH",
    department_name: "Mechanical Engineering",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },
  "civil.hod@univ.edu": {
    user_id: "FAC104",
    email: "civil.hod@univ.edu",
    name: "Dr. S. Ananth (Civil HOD)",
    role: "FACULTY",
    department_id: "DEPT_CIVIL",
    department_name: "Civil Engineering",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },
  "aids.hod@univ.edu": {
    user_id: "FAC105",
    email: "aids.hod@univ.edu",
    name: "Dr. Priya Venkatesh (AI & Data Science HOD)",
    role: "FACULTY",
    department_id: "DEPT_AIDS",
    department_name: "Artificial Intelligence & Data Science",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },
  "prof.sharma@univ.edu": {
    user_id: "FAC106",
    email: "prof.sharma@univ.edu",
    name: "Prof. Amit Sharma (Associate Professor, CSE)",
    role: "FACULTY",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },
  "prof.reddy@univ.edu": {
    user_id: "FAC107",
    email: "prof.reddy@univ.edu",
    name: "Prof. Kavitha Reddy (Assistant Professor, ECE)",
    role: "FACULTY",
    department_id: "DEPT_ECE",
    department_name: "Electronics & Communication Engineering",
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["department_analytics", "student_intervention"]
  },

  // 3. STUDENT ACCOUNTS (10)
  "student@univ.edu": {
    user_id: "STU20210001",
    email: "student@univ.edu",
    name: "Aarav Sharma (CSE Student)",
    role: "STUDENT",
    student_id: "STU20210001",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    semester: 5,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "aarav@univ.edu": {
    user_id: "STU20210001",
    email: "aarav@univ.edu",
    name: "Aarav Sharma (CSE Student)",
    role: "STUDENT",
    student_id: "STU20210001",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    semester: 5,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "sneha@univ.edu": {
    user_id: "STU20220013",
    email: "sneha@univ.edu",
    name: "Sneha Verma (CSE Freshman)",
    role: "STUDENT",
    student_id: "STU20220013",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    semester: 2,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "vikram@univ.edu": {
    user_id: "STU20230014",
    email: "vikram@univ.edu",
    name: "Vikram Gupta (AI&DS Senior)",
    role: "STUDENT",
    student_id: "STU20230014",
    department_id: "DEPT_AIDS",
    department_name: "Artificial Intelligence & Data Science",
    semester: 8,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "ananya@univ.edu": {
    user_id: "STU20240015",
    email: "ananya@univ.edu",
    name: "Ananya Iyer (ECE Merit Scholar)",
    role: "STUDENT",
    student_id: "STU20240015",
    department_id: "DEPT_ECE",
    department_name: "Electronics & Communication Engineering",
    semester: 4,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "rohan@univ.edu": {
    user_id: "STU20210016",
    email: "rohan@univ.edu",
    name: "Rohan Verma (MECH Shortage Alert)",
    role: "STUDENT",
    student_id: "STU20210016",
    department_id: "DEPT_MECH",
    department_name: "Mechanical Engineering",
    semester: 3,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "priya.patel@univ.edu": {
    user_id: "STU20220017",
    email: "priya.patel@univ.edu",
    name: "Priya Patel (CIVIL Student)",
    role: "STUDENT",
    student_id: "STU20220017",
    department_id: "DEPT_CIVIL",
    department_name: "Civil Engineering",
    semester: 6,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "karthik@univ.edu": {
    user_id: "STU20230018",
    email: "karthik@univ.edu",
    name: "Karthik Nair (CSE Final Year)",
    role: "STUDENT",
    student_id: "STU20230018",
    department_id: "DEPT_CSE",
    department_name: "Computer Science & Engineering",
    semester: 7,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "pooja@univ.edu": {
    user_id: "STU20240019",
    email: "pooja@univ.edu",
    name: "Pooja Joshi (AI&DS Freshman)",
    role: "STUDENT",
    student_id: "STU20240019",
    department_id: "DEPT_AIDS",
    department_name: "Artificial Intelligence & Data Science",
    semester: 1,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "rahul@univ.edu": {
    user_id: "STU20210020",
    email: "rahul@univ.edu",
    name: "Rahul Deshmukh (ECE Student)",
    role: "STUDENT",
    student_id: "STU20210020",
    department_id: "DEPT_ECE",
    department_name: "Electronics & Communication Engineering",
    semester: 5,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  },
  "divya@univ.edu": {
    user_id: "STU20220021",
    email: "divya@univ.edu",
    name: "Divya Sundaram (MECH Honors)",
    role: "STUDENT",
    student_id: "STU20220021",
    department_id: "DEPT_MECH",
    department_name: "Mechanical Engineering",
    semester: 6,
    password_hash: DEMO_PASSWORD_HASH,
    permissions: ["view_own_profile"]
  }
};

router.post('/auth/login', (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password.trim()) {
    return errorResponse(res, 'Email and password are required', 400);
  }

  const user = DEMO_USERS[cleanEmail];
  if (!user) {
    return errorResponse(res, 'Invalid email or password. Please select a demo account.', 401);
  }

  const inputHash = crypto.createHash('sha256').update(password.trim()).digest('hex');
  if (inputHash !== user.password_hash) {
    return errorResponse(res, 'Invalid password. (Use default password: demo1234)', 401);
  }

  const token = `jwt-token-${user.role.toLowerCase()}-${Date.now()}`;
  return successResponse(res, {
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    role: user.role,
    student_id: user.student_id,
    department_id: user.department_id,
    department_name: user.department_name,
    semester: user.semester,
    permissions: user.permissions,
    token
  }, 'Authenticated successfully');
});

router.get('/auth/accounts', (req, res) => {
  const accounts = Object.values(DEMO_USERS).map(u => ({
    email: u.email,
    name: u.name,
    role: u.role,
    department_id: u.department_id,
    department_name: u.department_name,
    semester: u.semester,
    student_id: u.student_id
  }));
  return successResponse(res, accounts, 'Demo accounts fetched');
});

export default router;
