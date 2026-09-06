import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import RoleGuard from './components/guards/RoleGuard';

import Navbar from './components/Navbar';

import Login from './pages/Login';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import StudentPortal from './pages/StudentPortal';
import FacultyPortal from './pages/FacultyPortal';
import AccountsPortal from './pages/AccountsPortal';
import StudentsDirectory from './pages/StudentsDirectory';
import FacultyDirectory from './pages/FacultyDirectory';
import FacultyWorkspace from './pages/FacultyWorkspace';
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

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--bg-canvas, #f8fafc)' }}>
      <Navbar />
      <main className="flex-grow-1 p-2 p-sm-3 p-md-4 overflow-auto">
        <div className="container-fluid py-2 px-2 px-md-4" style={{ maxWidth: '1600px' }}>
          {children}
        </div>
      </main>
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
                  <FacultyWorkspace />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/faculty-workspace"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['ADMIN']}>
                  <FacultyWorkspace />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          {/* Student Dedicated Module Routes */}
          <Route
            path="/attendance"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['STUDENT', 'FACULTY', 'HOD', 'ADMIN']}>
                  <StudentPortal defaultTab="attendance" />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/marks"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['STUDENT', 'FACULTY', 'HOD', 'ADMIN']}>
                  <StudentPortal defaultTab="marks" />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/cgpa"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['STUDENT', 'FACULTY', 'HOD', 'ADMIN']}>
                  <StudentPortal defaultTab="cgpa" />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/subjects"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['STUDENT', 'FACULTY', 'HOD', 'ADMIN']}>
                  <StudentPortal defaultTab="subjects" />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/timetable"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['STUDENT', 'FACULTY', 'HOD', 'ADMIN']}>
                  <StudentPortal defaultTab="schedule" />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/schedule"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['STUDENT', 'FACULTY', 'HOD', 'ADMIN']}>
                  <StudentPortal defaultTab="schedule" />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/fees"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['STUDENT', 'ACCOUNTS', 'ADMIN']}>
                  <StudentPortal defaultTab="fees" />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/notices"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['STUDENT', 'FACULTY', 'HOD', 'ACCOUNTS', 'ADMIN']}>
                  <StudentPortal defaultTab="notices" />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/documents"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['STUDENT', 'ADMIN']}>
                  <StudentPortal defaultTab="documents" />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          {/* Faculty Dedicated Module Routes */}
          <Route
            path="/faculty-attendance"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['FACULTY', 'HOD', 'ADMIN']}>
                  <FacultyPortal defaultTab="attendance" />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/faculty-marks"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['FACULTY', 'HOD', 'ADMIN']}>
                  <FacultyPortal defaultTab="marks" />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/faculty-alerts"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['FACULTY', 'HOD', 'ADMIN']}>
                  <FacultyPortal defaultTab="warnings" />
                </RoleGuard>
              </ProtectedLayout>
            }
          />

          <Route
            path="/faculty-mentoring"
            element={
              <ProtectedLayout>
                <RoleGuard roles={['FACULTY', 'HOD', 'ADMIN']}>
                  <FacultyPortal defaultTab="mentoring" />
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