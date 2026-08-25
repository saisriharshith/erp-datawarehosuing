import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_PRESETS = [
  // Deans / Admin
  { email: 'admin@univ.edu', name: 'Dr. Sarah Jenkins (Dean of Academic Affairs)', role: 'ADMIN', badge: 'Dean' },
  { email: 'provost@univ.edu', name: 'Prof. Arthur Pendelton (University Provost)', role: 'ADMIN', badge: 'Provost' },

  // Faculty / HODs — mapped directly to dim_faculty records
  { email: 'faculty@univ.edu', name: 'Dr. Rajeshwar Rao (Senior CSE Faculty)', role: 'FACULTY', faculty_id: 'FAC101', dept: 'DEPT_CSE', badge: 'Senior Faculty' },
  { email: 'cse.hod@univ.edu', name: 'Dr. Sunita Deshmukh (CSE HOD)', role: 'FACULTY', faculty_id: 'FAC102', dept: 'DEPT_CSE', badge: 'CSE HOD' },
  { email: 'prof.sharma@univ.edu', name: 'Dr. Amitabha Bose (Associate Prof, CSE)', role: 'FACULTY', faculty_id: 'FAC103', dept: 'DEPT_CSE', badge: 'Faculty' },
  { email: 'ece.hod@univ.edu', name: 'Dr. Rajeshwar Rao (ECE HOD)', role: 'FACULTY', faculty_id: 'FAC107', dept: 'DEPT_ECE', badge: 'ECE HOD' },
  { email: 'prof.reddy@univ.edu', name: 'Mr. Senthil Kumar (Assistant Prof, ECE)', role: 'FACULTY', faculty_id: 'FAC111', dept: 'DEPT_ECE', badge: 'Faculty' },
  { email: 'mech.hod@univ.edu', name: 'Dr. Rajeshwar Rao (Mechanical HOD)', role: 'FACULTY', faculty_id: 'FAC113', dept: 'DEPT_MECH', badge: 'MECH HOD' },
  { email: 'civil.hod@univ.edu', name: 'Dr. Rajeshwar Rao (Civil HOD)', role: 'FACULTY', faculty_id: 'FAC119', dept: 'DEPT_CIVIL', badge: 'CIVIL HOD' },
  { email: 'aids.hod@univ.edu', name: 'Dr. Rajeshwar Rao (AI&DS HOD)', role: 'FACULTY', faculty_id: 'FAC125', dept: 'DEPT_AIDS', badge: 'AI&DS HOD' },

  // Accounts & Finance
  { email: 'accounts@univ.edu', name: 'Mr. S. K. Sharma (Chief Accounts Officer / Bursar)', role: 'ACCOUNTS', badge: 'Accounts Officer' },
  { email: 'bursar@univ.edu', name: 'Mrs. Anita Roy (Senior Finance Officer)', role: 'ACCOUNTS', badge: 'Finance Officer' },

  // Students — mapped directly to verified real dim_students records
  { email: 'sai@univ.edu', name: 'Sai Gupta (STU20220001)', role: 'STUDENT', student_id: 'STU20220001', dept: 'DEPT_CSE', sem: 1, badge: 'Attendance Alert' },
  { email: 'aadhya@univ.edu', name: 'Aadhya Nair (STU20230002)', role: 'STUDENT', student_id: 'STU20230002', dept: 'DEPT_CIVIL', sem: 1, badge: 'Freshman' },
  { email: 'swati@univ.edu', name: 'Swati Bose (STU20240003)', role: 'STUDENT', student_id: 'STU20240003', dept: 'DEPT_CIVIL', sem: 5, badge: 'Merit Scholar' },
  { email: 'vihaan@univ.edu', name: 'Vihaan Reddy (STU20210004)', role: 'STUDENT', student_id: 'STU20210004', dept: 'DEPT_ECE', sem: 6, badge: 'Honors' },
  { email: 'nikhil@univ.edu', name: 'Nikhil Singh (STU20220005)', role: 'STUDENT', student_id: 'STU20220005', dept: 'DEPT_MECH', sem: 7, badge: 'Senior' },
  { email: 'meera@univ.edu', name: 'Meera Iyer (STU20230006)', role: 'STUDENT', student_id: 'STU20230006', dept: 'DEPT_ECE', sem: 4, badge: 'High Performer' },
  { email: 'vikram@univ.edu', name: 'Vikram Patel (STU20240007)', role: 'STUDENT', student_id: 'STU20240007', dept: 'DEPT_CSE', sem: 2, badge: 'Sports Quota' },
  { email: 'ananya@univ.edu', name: 'Ananya Kumar (STU20210008)', role: 'STUDENT', student_id: 'STU20210008', dept: 'DEPT_CIVIL', sem: 4, badge: 'Merit Scholar' },
  { email: 'aditya@univ.edu', name: 'Aditya Das (STU20220009)', role: 'STUDENT', student_id: 'STU20220009', dept: 'DEPT_CSE', sem: 5, badge: 'Dean List' },
  { email: 'varun@univ.edu', name: 'Varun Joshi (STU20230010)', role: 'STUDENT', student_id: 'STU20230010', dept: 'DEPT_CSE', sem: 7, badge: 'Final Year' }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ERP_USER_PROFILE');
      return saved ? JSON.parse(saved) : {
        email: 'admin@univ.edu',
        name: 'Dr. Sarah Jenkins (Dean of Academic Affairs)',
        role: 'ADMIN',
        permissions: ['all']
      };
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('ERP_AUTH_TOKEN'));
  const [isAuth, setIsAuth] = useState(Boolean(token));

  const login = async (email, password = 'demo1234') => {
    try {
      const res = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res && res.token) {
        setToken(res.token);
        setUser(res);
        setIsAuth(true);
        localStorage.setItem('ERP_AUTH_TOKEN', res.token);
        localStorage.setItem('ERP_USER_PROFILE', JSON.stringify(res));
        return { success: true, user: res };
      }
      return { success: false, message: 'Invalid response' };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.message };
    }
  };

  const switchAccount = async (email) => {
    const res = await login(email, 'demo1234');
    if (res.success) {
      return res.user;
    }
    throw new Error(res.message || 'Failed to switch account');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuth(false);
    localStorage.removeItem('ERP_AUTH_TOKEN');
    localStorage.removeItem('ERP_USER_PROFILE');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuth, login, logout, switchAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
