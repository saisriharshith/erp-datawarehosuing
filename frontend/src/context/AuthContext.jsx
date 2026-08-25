import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_PRESETS = [
  // Deans / Admin
  { email: 'admin@univ.edu', name: 'Dr. Sarah Jenkins (Dean of Academic Affairs)', role: 'ADMIN', badge: 'Dean' },
  { email: 'provost@univ.edu', name: 'Prof. Arthur Pendelton (University Provost)', role: 'ADMIN', badge: 'Provost' },

  // Faculty / HODs
  { email: 'cse.hod@univ.edu', name: 'Dr. R. Ramanujan (CSE HOD)', role: 'FACULTY', dept: 'DEPT_CSE', badge: 'CSE HOD' },
  { email: 'ece.hod@univ.edu', name: 'Dr. Meenakshi Sundaram (ECE HOD)', role: 'FACULTY', dept: 'DEPT_ECE', badge: 'ECE HOD' },
  { email: 'mech.hod@univ.edu', name: 'Dr. K. Vikram (Mechanical HOD)', role: 'FACULTY', dept: 'DEPT_MECH', badge: 'MECH HOD' },
  { email: 'civil.hod@univ.edu', name: 'Dr. S. Ananth (Civil HOD)', role: 'FACULTY', dept: 'DEPT_CIVIL', badge: 'CIVIL HOD' },
  { email: 'aids.hod@univ.edu', name: 'Dr. Priya Venkatesh (AI&DS HOD)', role: 'FACULTY', dept: 'DEPT_AIDS', badge: 'AI&DS HOD' },
  { email: 'prof.sharma@univ.edu', name: 'Prof. Amit Sharma (Associate Prof)', role: 'FACULTY', dept: 'DEPT_CSE', badge: 'Faculty' },
  { email: 'prof.reddy@univ.edu', name: 'Prof. Kavitha Reddy (Assistant Prof)', role: 'FACULTY', dept: 'DEPT_ECE', badge: 'Faculty' },
  { email: 'faculty@univ.edu', name: 'Prof. Rajeshwar Rao (Senior CSE Faculty)', role: 'FACULTY', dept: 'DEPT_CSE', badge: 'Senior Faculty' },

  // Students
  { email: 'aarav@univ.edu', name: 'Aarav Sharma (STU20210001)', role: 'STUDENT', student_id: 'STU20210001', dept: 'DEPT_CSE', sem: 5, badge: 'High Performer' },
  { email: 'sneha@univ.edu', name: 'Sneha Verma (STU20220013)', role: 'STUDENT', student_id: 'STU20220013', dept: 'DEPT_CSE', sem: 2, badge: 'Freshman' },
  { email: 'vikram@univ.edu', name: 'Vikram Gupta (STU20230014)', role: 'STUDENT', student_id: 'STU20230014', dept: 'DEPT_AIDS', sem: 8, badge: 'Senior' },
  { email: 'ananya@univ.edu', name: 'Ananya Iyer (STU20240015)', role: 'STUDENT', student_id: 'STU20240015', dept: 'DEPT_ECE', sem: 4, badge: 'Merit Scholar' },
  { email: 'rohan@univ.edu', name: 'Rohan Verma (STU20210016)', role: 'STUDENT', student_id: 'STU20210016', dept: 'DEPT_MECH', sem: 3, badge: 'Attendance Alert' },
  { email: 'priya.patel@univ.edu', name: 'Priya Patel (STU20220017)', role: 'STUDENT', student_id: 'STU20220017', dept: 'DEPT_CIVIL', sem: 6, badge: 'Remedial' },
  { email: 'karthik@univ.edu', name: 'Karthik Nair (STU20230018)', role: 'STUDENT', student_id: 'STU20230018', dept: 'DEPT_CSE', sem: 7, badge: 'Final Year' },
  { email: 'pooja@univ.edu', name: 'Pooja Joshi (STU20240019)', role: 'STUDENT', student_id: 'STU20240019', dept: 'DEPT_AIDS', sem: 1, badge: 'Freshman' },
  { email: 'rahul@univ.edu', name: 'Rahul Deshmukh (STU20210020)', role: 'STUDENT', student_id: 'STU20210020', dept: 'DEPT_ECE', sem: 5, badge: 'Fee Due' },
  { email: 'divya@univ.edu', name: 'Divya Sundaram (STU20220021)', role: 'STUDENT', student_id: 'STU20220021', dept: 'DEPT_MECH', sem: 6, badge: 'Honors' }
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

  const [dbHealth, setDbHealth] = useState(null);

  useEffect(() => {
    fetchAPI('/health')
      .then(data => setDbHealth(data))
      .catch(() => setDbHealth({ mongodb_connected: false, mode: 'Offline' }));
  }, []);

  const login = async (email, password = 'demo1234') => {
    const data = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setUser(data);
    localStorage.setItem('ERP_USER_PROFILE', JSON.stringify(data));
    localStorage.setItem('ERP_AUTH_TOKEN', data.token);
    return data;
  };

  const switchAccount = async (email) => {
    return login(email, 'demo1234');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ERP_USER_PROFILE');
    localStorage.removeItem('ERP_AUTH_TOKEN');
  };

  return (
    <AuthContext.Provider value={{ user, dbHealth, login, switchAccount, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
