import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ mobileOpen = false, onCloseMobile = () => {} }) {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role || 'STUDENT';

  // Helper to check active tab query param
  const isActiveTab = (path, tab) => {
    if (location.pathname !== path) return false;
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab') || 'overview';
    return currentTab === tab;
  };

  const getLinkClass = (isActive) =>
    `d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none transition-all mb-1 ${
      isActive
        ? 'bg-primary text-white fw-semibold shadow-sm'
        : 'text-secondary hover-bg-subtle'
    }`;

  const navItemStyle = {
    fontSize: '0.85rem',
    cursor: 'pointer',
    color: 'inherit'
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040, backdropFilter: 'blur(4px)' }}
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`border-end position-sticky top-0 d-flex flex-column justify-content-between p-3 ${
          mobileOpen ? 'd-flex' : 'd-none d-lg-flex'
        }`}
        style={{
          width: '260px',
          minWidth: '260px',
          height: 'calc(100vh - 65px)',
          overflowY: 'auto',
          backgroundColor: 'var(--surface-card, #ffffff)',
          borderColor: 'var(--border-color, #e2e8f0)',
          zIndex: mobileOpen ? 1045 : 10,
          position: mobileOpen ? 'fixed' : 'sticky',
          top: mobileOpen ? '0' : '65px',
          left: 0,
          boxShadow: mobileOpen ? '0 10px 25px rgba(0,0,0,0.3)' : 'none'
        }}
      >
        <div>
          {/* Mobile Header with Close Button */}
          {mobileOpen && (
            <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom d-lg-none">
              <span className="fw-bold fs-6">Navigation Menu</span>
              <button type="button" className="btn-close" onClick={onCloseMobile} aria-label="Close"></button>
            </div>
          )}

          {/* Navigation Items */}
          <nav>
            {/* ================================================================= */}
            {/* 1. STUDENT PERSONA NAVIGATION */}
            {/* ================================================================= */}
            {role === 'STUDENT' && (
              <>
                <div className="mb-3">
                  <div className="text-muted text-uppercase fw-bold px-2 mb-1" style={{ fontSize: '0.68rem' }}>
                    Dashboard
                  </div>
                  <NavLink
                    to="/student-portal?tab=overview"
                    className={() => getLinkClass(isActiveTab('/student-portal', 'overview'))}
                    onClick={onCloseMobile}
                  >
                    <i className="bi bi-grid-fill"></i>
                    <span style={navItemStyle}>Student Dashboard</span>
                  </NavLink>
                </div>

                <div className="mb-3">
                  <div className="text-muted text-uppercase fw-bold px-2 mb-1" style={{ fontSize: '0.68rem' }}>
                    Academic Progress
                  </div>
                  <NavLink
                    to="/student-portal?tab=attendance"
                    className={() => getLinkClass(isActiveTab('/student-portal', 'attendance'))}
                    onClick={onCloseMobile}
                  >
                    <i className="bi bi-calendar-check-fill"></i>
                    <span style={navItemStyle}>Attendance Record</span>
                  </NavLink>
                  <NavLink
                    to="/student-portal?tab=marks"
                    className={() => getLinkClass(isActiveTab('/student-portal', 'marks'))}
                    onClick={onCloseMobile}
                  >
                    <i className="bi bi-journal-bookmark-fill"></i>
                    <span style={navItemStyle}>Semester Marks & Grades</span>
                  </NavLink>
                  <NavLink
                    to="/student-portal?tab=cgpa"
                    className={() => getLinkClass(isActiveTab('/student-portal', 'cgpa'))}
                    onClick={onCloseMobile}
                  >
                    <i className="bi bi-graph-up-arrow"></i>
                    <span style={navItemStyle}>SGPA / CGPA Progression</span>
                  </NavLink>
                </div>

                <div className="mb-3">
                  <div className="text-muted text-uppercase fw-bold px-2 mb-1" style={{ fontSize: '0.68rem' }}>
                    Schedule & Courses
                  </div>
                  <NavLink
                    to="/student-portal?tab=schedule"
                    className={() => getLinkClass(isActiveTab('/student-portal', 'schedule'))}
                    onClick={onCloseMobile}
                  >
                    <i className="bi bi-clock-history"></i>
                    <span style={navItemStyle}>Class Timetable</span>
                  </NavLink>
                </div>

                <div className="mb-3">
                  <div className="text-muted text-uppercase fw-bold px-2 mb-1" style={{ fontSize: '0.68rem' }}>
                    Finance
                  </div>
                  <NavLink
                    to="/student-portal?tab=fees"
                    className={() => getLinkClass(isActiveTab('/student-portal', 'fees'))}
                    onClick={onCloseMobile}
                  >
                    <i className="bi bi-receipt"></i>
                    <span style={navItemStyle}>Fee Ledger & Receipts</span>
                  </NavLink>
                </div>

                <div className="mb-3">
                  <div className="text-muted text-uppercase fw-bold px-2 mb-1" style={{ fontSize: '0.68rem' }}>
                    Communication
                  </div>
                  <NavLink
                    to="/student-portal?tab=notices"
                    className={() => getLinkClass(isActiveTab('/student-portal', 'notices'))}
                    onClick={onCloseMobile}
                  >
                    <i className="bi bi-megaphone-fill"></i>
                    <span style={navItemStyle}>Notices & Circulars</span>
                  </NavLink>
                </div>

                <div className="mb-3">
                  <div className="text-muted text-uppercase fw-bold px-2 mb-1" style={{ fontSize: '0.68rem' }}>
                    Certificates & Records
                  </div>
                  <NavLink
                    to="/student-portal?tab=documents"
                    className={() => getLinkClass(isActiveTab('/student-portal', 'documents'))}
                    onClick={onCloseMobile}
                  >
                    <i className="bi bi-file-earmark-pdf-fill"></i>
                    <span style={navItemStyle}>Official Documents</span>
                  </NavLink>
                </div>
              </>
            )}

            {/* ================================================================= */}
            {/* 2. FACULTY PERSONA NAVIGATION */}
            {/* ================================================================= */}
            {role === 'FACULTY' && (
              <>
                <div className="mb-3">
                  <div className="text-muted text-uppercase fw-bold px-2 mb-1" style={{ fontSize: '0.68rem' }}>
                    Teaching Workspace
                  </div>
                  <NavLink
                    to="/faculty-portal?tab=roster"
                    className={() => getLinkClass(isActiveTab('/faculty-portal', 'roster'))}
                    onClick={onCloseMobile}
                  >
                    <i className="bi bi-speedometer2"></i>
                    <span style={navItemStyle}>Teaching Dashboard</span>
                  </NavLink>
                </div>

                <div className="mb-3">
                  <div className="text-muted text-uppercase fw-bold px-2 mb-1" style={{ fontSize: '0.68rem' }}>
                    Daily Academic Duties
                  </div>
                  <NavLink
                    to="/faculty-portal?tab=attendance"
                    className={() => getLinkClass(isActiveTab('/faculty-portal', 'attendance'))}
                    onClick={onCloseMobile}
                  >
                    <i className="bi bi-check2-square"></i>
                    <span style={navItemStyle}>Take Attendance</span>
                  </NavLink>
                  <NavLink
                    to="/faculty-portal?tab=marks"
                    className={() => getLinkClass(isActiveTab('/faculty-portal', 'marks'))}
                    onClick={onCloseMobile}
                  >
                    <i className="bi bi-pencil-square"></i>
                    <span style={navItemStyle}>Enter Internal Marks</span>
                  </NavLink>
                </div>

                <div className="mb-3">
                  <div className="text-muted text-uppercase fw-bold px-2 mb-1" style={{ fontSize: '0.68rem' }}>
                    Advisee & Mentorship
                  </div>
                  <NavLink
                    to="/faculty-portal?tab=warnings"
                    className={() => getLinkClass(isActiveTab('/faculty-portal', 'warnings'))}
                    onClick={onCloseMobile}
                  >
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span style={navItemStyle}>Low Attendance Alerts</span>
                  </NavLink>
                  <NavLink
                    to="/faculty-portal?tab=mentoring"
                    className={() => getLinkClass(isActiveTab('/faculty-portal', 'mentoring'))}
                    onClick={onCloseMobile}
                  >
                    <i className="bi bi-chat-left-text-fill"></i>
                    <span style={navItemStyle}>Counseling Log</span>
                  </NavLink>
                </div>
              </>
            )}

            {/* ================================================================= */}
            {/* 3. ACCOUNTS / BURSAR PERSONA NAVIGATION */}
            {/* ================================================================= */}
            {role === 'ACCOUNTS' && (
              <>
                <div className="mb-3">
                  <div className="text-muted text-uppercase fw-bold px-2 mb-1" style={{ fontSize: '0.68rem' }}>
                    Finance & Bursar
                  </div>
                  <NavLink to="/accounts" className={({ isActive }) => getLinkClass(isActive)} onClick={onCloseMobile}>
                    <i className="bi bi-wallet2"></i>
                    <span style={navItemStyle}>Tuition & Ledger</span>
                  </NavLink>
                  <NavLink to="/students" className={({ isActive }) => getLinkClass(isActive)} onClick={onCloseMobile}>
                    <i className="bi bi-people-fill"></i>
                    <span style={navItemStyle}>Students Master</span>
                  </NavLink>
                </div>
              </>
            )}

            {/* ================================================================= */}
            {/* 4. ADMIN / DEAN PERSONA NAVIGATION */}
            {/* ================================================================= */}
            {role === 'ADMIN' && (
              <>
                <div className="mb-3">
                  <div className="text-muted text-uppercase fw-bold px-2 mb-1" style={{ fontSize: '0.68rem' }}>
                    Administration
                  </div>
                  <NavLink to="/dashboard" className={({ isActive }) => getLinkClass(isActive)} onClick={onCloseMobile}>
                    <i className="bi bi-grid-1x2-fill"></i>
                    <span style={navItemStyle}>Dashboard</span>
                  </NavLink>
                  <NavLink to="/student-portal" className={({ isActive }) => getLinkClass(isActive)} onClick={onCloseMobile}>
                    <i className="bi bi-person-badge-fill"></i>
                    <span style={navItemStyle}>Student Records (360)</span>
                  </NavLink>
                  <NavLink to="/faculty-portal" className={({ isActive }) => getLinkClass(isActive)} onClick={onCloseMobile}>
                    <i className="bi bi-mortarboard-fill"></i>
                    <span style={navItemStyle}>Faculty Workspace</span>
                  </NavLink>
                  <NavLink to="/accounts" className={({ isActive }) => getLinkClass(isActive)} onClick={onCloseMobile}>
                    <i className="bi bi-wallet2"></i>
                    <span style={navItemStyle}>Tuition & Fees</span>
                  </NavLink>
                </div>

                <div className="mb-3">
                  <div className="text-muted text-uppercase fw-bold px-2 mb-1" style={{ fontSize: '0.68rem' }}>
                    Directories
                  </div>
                  <NavLink to="/students" className={({ isActive }) => getLinkClass(isActive)} onClick={onCloseMobile}>
                    <i className="bi bi-people-fill"></i>
                    <span style={navItemStyle}>Students Directory</span>
                  </NavLink>
                  <NavLink to="/faculty" className={({ isActive }) => getLinkClass(isActive)} onClick={onCloseMobile}>
                    <i className="bi bi-person-workspace"></i>
                    <span style={navItemStyle}>Faculty Directory</span>
                  </NavLink>
                </div>
              </>
            )}
          </nav>
        </div>

        {/* Institutional Footer */}
        <div
          className="pt-2 border-top text-center text-muted"
          style={{
            borderColor: 'var(--border-color, #e2e8f0)',
            fontSize: '0.72rem'
          }}
        >
          <span className="fw-semibold">UnivAnalytics ERP</span> &copy; {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}
