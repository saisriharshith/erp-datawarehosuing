import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  return (
    <aside className="app-sidebar p-3 d-flex flex-column justify-content-between">
      <div>
        <div className="text-uppercase small fw-bold text-muted px-3 mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
          {role === 'STUDENT'
            ? 'Student Workspace'
            : role === 'FACULTY'
            ? 'Faculty Workspace'
            : role === 'ACCOUNTS'
            ? 'Accounts & Bursar'
            : 'Institutional DW'}
        </div>

        <nav className="nav flex-column gap-1">
          {/* STUDENT PERSONA */}
          {role === 'STUDENT' && (
            <>
              <NavLink to="/student-portal" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-person-workspace text-primary"></i>
                <span>My Academic Hub</span>
              </NavLink>
              <NavLink to="/students" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-person-lines-fill text-muted"></i>
                <span>Student Directory</span>
              </NavLink>
            </>
          )}

          {/* FACULTY PERSONA */}
          {role === 'FACULTY' && (
            <>
              <NavLink to="/faculty-portal" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-person-workspace text-info"></i>
                <span>Department Portal</span>
              </NavLink>
              <NavLink to="/students" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-people text-muted"></i>
                <span>Advisee Roster</span>
              </NavLink>
              <NavLink to="/risk-analysis" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-speedometer2 text-danger"></i>
                <span>Risk What-If Tool</span>
              </NavLink>
              <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-bar-chart-fill text-muted"></i>
                <span>Executive Overview</span>
              </NavLink>
            </>
          )}

          {/* ACCOUNTS & FINANCE PERSONA */}
          {role === 'ACCOUNTS' && (
            <>
              <NavLink to="/accounts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-wallet2 text-warning"></i>
                <span>Fee & Accounts Ledger</span>
              </NavLink>
              <NavLink to="/students" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-people-fill text-secondary"></i>
                <span>Students Master</span>
              </NavLink>
              <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-pie-chart-fill text-primary"></i>
                <span>Executive Overview</span>
              </NavLink>
            </>
          )}

          {/* ADMIN / DEAN PERSONA */}
          {role === 'ADMIN' && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-grid-1x2-fill text-primary"></i>
                <span>Executive Overview</span>
              </NavLink>
              <NavLink to="/student-portal" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-person-badge-fill text-success"></i>
                <span>Student 360 Hub</span>
              </NavLink>
              <NavLink to="/faculty-portal" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-mortarboard-fill text-info"></i>
                <span>Faculty & HOD Hub</span>
              </NavLink>
              <NavLink to="/accounts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-wallet2 text-warning"></i>
                <span>Tuition & Accounts</span>
              </NavLink>
              <NavLink to="/students" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-people-fill text-secondary"></i>
                <span>Students Master</span>
              </NavLink>
              <NavLink to="/risk-analysis" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-speedometer2 text-danger"></i>
                <span>Risk What-If Engine</span>
              </NavLink>
              <NavLink to="/data-quality" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-shield-check text-success"></i>
                <span>5-Dimension Quality</span>
              </NavLink>
              <NavLink to="/faculty" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-person-video3 text-dark"></i>
                <span>Faculty Directory</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Footer Branding */}
      <div className="px-3 pt-3 border-top text-muted small" style={{ fontSize: '0.75rem' }}>
        <div>Stack: <strong>MERN (MongoDB + Express + React + Node)</strong></div>
        <div className="text-muted mt-1">Accuracy: 94.5% | DQ: 99.68%</div>
      </div>
    </aside>
  );
}
