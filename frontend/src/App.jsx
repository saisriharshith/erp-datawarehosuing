import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import StudentPortal from './pages/StudentPortal';
import FacultyPortal from './pages/FacultyPortal';
import StudentsDirectory from './pages/StudentsDirectory';
import RiskAnalysis from './pages/RiskAnalysis';
import DataQuality from './pages/DataQuality';
import FacultyDirectory from './pages/FacultyDirectory';
import AccountsPortal from './pages/AccountsPortal';

function ProtectedLayout({ children }) {
  const { isAuth } = useAuth();
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <main className="flex-grow-1 bg-light" style={{ overflowY: 'auto', minHeight: 'calc(100vh - 65px)' }}>
          {children}
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
    return <Navigate to="/dashboard" replace />;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={getInitialHome()} />

      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <ExecutiveDashboard />
          </ProtectedLayout>
        }
      />

      <Route
        path="/student-portal"
        element={
          <ProtectedLayout>
            <StudentPortal />
          </ProtectedLayout>
        }
      />

      <Route
        path="/faculty-portal"
        element={
          <ProtectedLayout>
            <FacultyPortal />
          </ProtectedLayout>
        }
      />

      <Route
        path="/accounts"
        element={
          <ProtectedLayout>
            <AccountsPortal />
          </ProtectedLayout>
        }
      />

      <Route
        path="/students"
        element={
          <ProtectedLayout>
            <StudentsDirectory />
          </ProtectedLayout>
        }
      />

      <Route
        path="/risk-analysis"
        element={
          <ProtectedLayout>
            <RiskAnalysis />
          </ProtectedLayout>
        }
      />

      <Route
        path="/data-quality"
        element={
          <ProtectedLayout>
            <DataQuality />
          </ProtectedLayout>
        }
      />

      <Route
        path="/faculty"
        element={
          <ProtectedLayout>
            <FacultyDirectory />
          </ProtectedLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
