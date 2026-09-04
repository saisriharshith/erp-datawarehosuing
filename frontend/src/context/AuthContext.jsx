import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export const INSTITUTIONAL_DIRECTORY = [
  // 1. Leadership / Administration
  {
    email: 'admin@univ.edu',
    name: 'Admin',
    role: 'ADMIN',
    title: 'System Administrator',
    department: 'Institutional Governance',
    accessLevel: 'Tier 1 — Full Executive Control (All Records)',
    color: '#4f46e5',
  },
  {
    email: 'provost@univ.edu',
    name: 'Admin',
    role: 'ADMIN',
    title: 'University Provost',
    department: 'Office of the Provost',
    accessLevel: 'Tier 1 — Full Executive Control (All Records)',
    color: '#4f46e5',
  },

  // 2. Faculty / Department HODs
  {
    email: 'cse.hod@univ.edu',
    name: 'Dr. Sunita Deshmukh',
    role: 'FACULTY',
    title: 'HOD & Professor (CSE)',
    department: 'Computer Science & Engineering',
    accessLevel: 'Department-Scoped Academic & Advisee Control',
    color: '#0284c7',
  },
  {
    email: 'faculty@univ.edu',
    name: 'Dr. Rajeshwar Rao',
    role: 'FACULTY',
    title: 'Senior Faculty (CSE)',
    department: 'Computer Science & Engineering',
    accessLevel: 'Department Advisees & Courses',
    color: '#0284c7',
  },
  {
    email: 'ece.hod@univ.edu',
    name: 'Dr. Rajeshwar Rao',
    role: 'FACULTY',
    title: 'HOD & Professor (ECE)',
    department: 'Electronics & Communication',
    accessLevel: 'Department-Scoped Academic Control',
    color: '#0284c7',
  },
  {
    email: 'mech.hod@univ.edu',
    name: 'Dr. Rajeshwar Rao',
    role: 'FACULTY',
    title: 'HOD & Professor (MECH)',
    department: 'Mechanical Engineering',
    accessLevel: 'Department-Scoped Academic Control',
    color: '#0284c7',
  },
  {
    email: 'civil.hod@univ.edu',
    name: 'Dr. Rajeshwar Rao',
    role: 'FACULTY',
    title: 'HOD & Professor (CIVIL)',
    department: 'Civil Engineering',
    accessLevel: 'Department-Scoped Academic Control',
    color: '#0284c7',
  },
  {
    email: 'aids.hod@univ.edu',
    name: 'Dr. Rajeshwar Rao',
    role: 'FACULTY',
    title: 'HOD & Professor (AI&DS)',
    department: 'Artificial Intelligence & Data Science',
    accessLevel: 'Department-Scoped Academic Control',
    color: '#0284c7',
  },

  // 3. Accounts & Bursar
  {
    email: 'accounts@univ.edu',
    name: 'Mr. S. K. Sharma',
    role: 'ACCOUNTS',
    title: 'Chief Accounts Officer & Bursar',
    department: 'Tuition & Finance Directorate',
    accessLevel: 'Fee Collection, Defaulters & Ledger Access',
    color: '#d97706',
  },
  {
    email: 'bursar@univ.edu',
    name: 'Mrs. Anita Roy',
    role: 'ACCOUNTS',
    title: 'Senior Finance Officer',
    department: 'Finance Directorate',
    accessLevel: 'Fee Collection & Reconciliation',
    color: '#d97706',
  },

  // 4. Students
  {
    email: 'sai@univ.edu',
    name: 'Sai Gupta',
    role: 'STUDENT',
    title: 'B.Tech CSE Student (Sem 1)',
    department: 'Computer Science',
    studentId: 'STU20220001',
    accessLevel: 'Self-Service Academic 360 & Hall Ticket',
    color: '#059669',
  },
  {
    email: 'student@univ.edu',
    name: 'Sai Gupta',
    role: 'STUDENT',
    title: 'B.Tech CSE Student (Sem 1)',
    department: 'Computer Science',
    studentId: 'STU20220001',
    accessLevel: 'Self-Service Academic 360 & Hall Ticket',
    color: '#059669',
  },
  {
    email: 'aadhya@univ.edu',
    name: 'Aadhya Nair',
    role: 'STUDENT',
    title: 'B.Tech Civil Student (Sem 1)',
    department: 'Civil Engineering',
    studentId: 'STU20230002',
    accessLevel: 'Self-Service Academic 360',
    color: '#059669',
  },
  {
    email: 'swati@univ.edu',
    name: 'Swati Bose',
    role: 'STUDENT',
    title: 'B.Tech Civil Student (Sem 5)',
    department: 'Civil Engineering',
    studentId: 'STU20240003',
    accessLevel: 'Self-Service Academic 360',
    color: '#059669',
  },
  {
    email: 'vihaan@univ.edu',
    name: 'Vihaan Reddy',
    role: 'STUDENT',
    title: 'B.Tech ECE Student (Sem 6)',
    department: 'Electronics & Communication',
    studentId: 'STU20210004',
    accessLevel: 'Self-Service Academic 360',
    color: '#059669',
  },
  {
    email: 'nikhil@univ.edu',
    name: 'Nikhil Singh',
    role: 'STUDENT',
    title: 'B.Tech MECH Student (Sem 7)',
    department: 'Mechanical Engineering',
    studentId: 'STU20220005',
    accessLevel: 'Self-Service Academic 360',
    color: '#059669',
  },
  {
    email: 'meera@univ.edu',
    name: 'Meera Iyer',
    role: 'STUDENT',
    title: 'B.Tech ECE Student (Sem 4)',
    department: 'Electronics & Communication',
    studentId: 'STU20230006',
    accessLevel: 'Self-Service Academic 360',
    color: '#059669',
  },
  {
    email: 'vikram@univ.edu',
    name: 'Vikram Patel',
    role: 'STUDENT',
    title: 'B.Tech CSE Student (Sem 2)',
    department: 'Computer Science',
    studentId: 'STU20240007',
    accessLevel: 'Self-Service Academic 360',
    color: '#059669',
  },
  {
    email: 'ananya@univ.edu',
    name: 'Ananya Kumar',
    role: 'STUDENT',
    title: 'B.Tech Civil Student (Sem 4)',
    department: 'Civil Engineering',
    studentId: 'STU20210008',
    accessLevel: 'Self-Service Academic 360',
    color: '#059669',
  },
  {
    email: 'aditya@univ.edu',
    name: 'Aditya Das',
    role: 'STUDENT',
    title: 'B.Tech CSE Student (Sem 5)',
    department: 'Computer Science',
    studentId: 'STU20220009',
    accessLevel: 'Self-Service Academic 360',
    color: '#059669',
  },
  {
    email: 'varun@univ.edu',
    name: 'Varun Joshi',
    role: 'STUDENT',
    title: 'B.Tech CSE Student (Sem 7)',
    department: 'Computer Science',
    studentId: 'STU20230010',
    accessLevel: 'Self-Service Academic 360',
    color: '#059669',
  }
];

// Alias for backwards compatibility
export const DEMO_PRESETS = INSTITUTIONAL_DIRECTORY;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ERP_USER_PROFILE');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('ERP_AUTH_TOKEN'));
  const [isAuth, setIsAuth] = useState(Boolean(token && user));
  const [dbHealth, setDbHealth] = useState({ mongodb_connected: true });

  useEffect(() => {
    setIsAuth(Boolean(token && user));
  }, [token, user]);

  // Fetch db health status
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(json => {
        if (json && json.data) setDbHealth(json.data);
      })
      .catch(() => setDbHealth({ mongodb_connected: false }));
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const body = res.data || res;
      const data = body.data !== undefined ? body.data : body;

      if (body.success || data.user || data.token || data.accessToken) {
        const authedUser = data.user || {
          email,
          role: data.role || 'STUDENT',
          name: email.split('@')[0],
        };
        const authToken = data.accessToken || data.token || 'jwt_active_session';

        setUser(authedUser);
        setToken(authToken);
        setIsAuth(true);

        localStorage.setItem('ERP_AUTH_TOKEN', authToken);
        localStorage.setItem('ERP_USER_PROFILE', JSON.stringify(authedUser));

        return { success: true, user: authedUser, role: authedUser.role };
      }

    } catch (err) {
      console.error('[AUTH] Login error:', err);
      let msg = err.response?.data?.message || err.message || 'Invalid institutional credentials';
      if (err.response?.status === 429) {
        msg = 'Too many requests. Please wait a moment and try signing in again.';
      }
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      // Non-fatal
    }
    localStorage.removeItem('ERP_AUTH_TOKEN');
    localStorage.removeItem('ERP_USER_PROFILE');
    setToken(null);
    setUser(null);
    setIsAuth(false);
  };

  const hasRole = (role) => user?.role === role;

  const hasPermission = (perm) => {
    if (!user?.permissions) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(perm);
  };

  const canAccess = (role, permission) => {
    if (user?.role === 'ADMIN') return true;
    if (hasRole(role)) {
      if (permission && hasPermission(permission)) return true;
      if (!permission) return true;
    }
    return false;
  };

  const switchAccount = async (email) => {
    const res = await login(email, 'demo1234');
    if (res && res.success) {
      return res.user;
    }
    throw new Error(res?.message || 'Failed to switch account');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuth,
        dbHealth,
        login,
        logout,
        switchAccount,
        hasRole,
        hasPermission,
        canAccess,
      }}
    >
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

export function useAuthStatus() {
  const { isAuth } = useAuth();
  return isAuth;
}

export function useUserRole() {
  const { user } = useAuth();
  return user?.role || null;
}

export default AuthContext;