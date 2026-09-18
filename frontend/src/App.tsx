import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { LoginPage } from './pages/Login';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { StudentsPage } from './pages/admin/Students';
import { StudentProfile } from './pages/admin/StudentProfile';
import { LecturersPage } from './pages/admin/Lecturers';
import { CoursesPage } from './pages/admin/Courses';
import { UnitsPage } from './pages/admin/Units';
import { VenuesPage } from './pages/admin/Venues';
import { AttendanceRecordsPage } from './pages/admin/Attendance';
import { ReportsPage } from './pages/admin/Reports';
import { AdminAnalyticsPage } from './pages/admin/Analytics';
import { SettingsPage } from './pages/admin/Settings';
import { AuditLogsPage } from './pages/admin/AuditLogs';

// Lecturer Pages
import { LecturerDashboard } from './pages/lecturer/Dashboard';
import { LecturerSessionsPage } from './pages/lecturer/Sessions';
import { NewSessionPage } from './pages/lecturer/NewSession';
import { LiveAttendanceStudio } from './pages/lecturer/LiveAttendance';
import { LecturerReportsPage } from './pages/lecturer/Reports';
import { LecturerAnalyticsPage } from './pages/lecturer/Analytics';

// Root redirect handler
const RootRedirect: React.FC = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/lecturer/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth */}
            <Route path="/login" element={<LoginPage />} />

            {/* Root Dispatcher */}
            <Route path="/" element={<RootRedirect />} />

            {/* Admin Protected Console */}
            <Route element={<DashboardLayout requiredRole="ADMIN" />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<StudentsPage />} />
              <Route path="/admin/students/:id" element={<StudentProfile />} />
              <Route path="/admin/lecturers" element={<LecturersPage />} />
              <Route path="/admin/courses" element={<CoursesPage />} />
              <Route path="/admin/units" element={<UnitsPage />} />
              <Route path="/admin/venues" element={<VenuesPage />} />
              <Route path="/admin/attendance" element={<AttendanceRecordsPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
              <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
            </Route>

            {/* Lecturer Protected Portal */}
            <Route element={<DashboardLayout requiredRole="LECTURER" />}>
              <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
              <Route path="/lecturer/sessions" element={<LecturerSessionsPage />} />
              <Route path="/lecturer/sessions/new" element={<NewSessionPage />} />
              <Route path="/lecturer/sessions/:id/live" element={<LiveAttendanceStudio />} />
              <Route path="/lecturer/reports" element={<LecturerReportsPage />} />
              <Route path="/lecturer/analytics" element={<LecturerAnalyticsPage />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};
