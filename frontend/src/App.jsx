import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import RoleGuard from './components/guards/RoleGuard';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import StudentPortal from './pages/StudentPortal';
import FacultyPortal from './pages/FacultyPortal';
import AccountsPortal from './pages/AccountsPortal';
import StudentsDirectory from './pages/StudentsDirectory';
import FacultyDirectory from './pages/FacultyDirectory';
import RiskAnalysis from './pages/RiskAnalysis';
import DataQuality from './pages/DataQuality';
import Forbidden from './pages/auth/Forbidden';
import NotFound from './pages/auth/NotFound';

// Role-home redirect component
const RoleHomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const redirectMap = {
    STUDENT: '/student-portal',
    FACULTY: '/faculty-portal',
    ADMIN: '/dashboard',
    ACCOUNTS: '/accounts',
  };

  const target = redirectMap[user.role];
  if (target) return <Navigate to={target} replace />;

  return null;
};

function ProtectedLayout({ children }) {
  const { isAuth } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--bg-canvas, #f8fafc)' }}>
      <Navbar onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)} />
      <div className="d-flex flex-grow-1 w-100 position-relative">
        <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
        <main className="flex-grow-1 p-2 p-sm-3 p-md-4 overflow-auto" style={{ minWidth: 0 }}>
          <div className="container-fluid py-1 px-1 px-sm-2 px-md-3" style={{ maxWidth: '1440px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuth, user } = useAuth();

  const getInitialHome = () => {
    if (!isAuth) return <Navigate to="/login" replace />;
    if (user?.role === 'STUDENT') return <Navigate to="/student-portal" replace />;
    if (user?.role === 'FACULTY') return <Navigate to="/faculty-portal" replace />;
    if (user?.role === 'ACCOUNTS') return <Navigate to="/accounts" replace />;
    if (user?.role === 'ADMIN') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  };

  return (
    <div className="min-h-screen">
      <Routes>

          {/* Auth routes - public */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <RoleHomeRedirect />
              </ProtectedLayout>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['ADMIN']}>
                  <ExecutiveDashboard />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/student-portal"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['STUDENT', 'FACULTY', 'HOD', 'ADMIN']}>
                  <StudentPortal />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/faculty-portal"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['FACULTY', 'HOD', 'ADMIN']}>
                  <FacultyPortal />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/accounts"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['ACCOUNTS', 'ADMIN']}>
                  <AccountsPortal />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/students"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['ADMIN', 'HOD', 'ACCOUNTS']}>
                  <StudentsDirectory />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/faculty"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['ADMIN']}>
                  <FacultyDirectory />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/risk-analysis"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['ADMIN', 'FACULTY', 'HOD']}>
                  <RiskAnalysis />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/data-quality"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['ADMIN']}>
                  <DataQuality />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          {/* Forbidden page */}
          <Route path="/forbidden" element={<Forbidden />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

      </Routes>
    </div>
  );
}