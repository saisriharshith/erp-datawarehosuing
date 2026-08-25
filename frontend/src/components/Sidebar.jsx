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
            ? 'Student Persona'
            : role === 'FACULTY'
            ? 'Faculty / HOD Persona'
            : role === 'ACCOUNTS'
            ? 'Accounts & Bursar'
            : 'Dean / Administrator'}
        </div>

        <nav className="nav flex-column gap-1">
          {/* STUDENT PERSONA ("How Am I Doing?") */}
          {role === 'STUDENT' && (
            <>
              <NavLink to="/student-portal" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-mortarboard-fill text-primary"></i>
                <span>My Academic Portal</span>
              </NavLink>
            </>
          )}

          {/* FACULTY / HOD PERSONA ("How Are My Students Doing?") */}
          {role === 'FACULTY' && (
            <>
              <NavLink to="/faculty-portal" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-people-fill text-info"></i>
                <span>Department Academic Portal</span>
              </NavLink>
              <NavLink to="/students" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-person-lines-fill text-muted"></i>
                <span>Department Advisees</span>
              </NavLink>
              <NavLink to="/risk-analysis" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-sliders text-danger"></i>
                <span>Advisee What-If Tool</span>
              </NavLink>
            </>
          )}

          {/* ACCOUNTS & FINANCE PERSONA */}
          {role === 'ACCOUNTS' && (
            <>
              <NavLink to="/accounts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-wallet2 text-warning"></i>
                <span>Tuition & Accounts Directorate</span>
              </NavLink>
              <NavLink to="/students" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-people-fill text-secondary"></i>
                <span>Students Master</span>
              </NavLink>
            </>
          )}

          {/* DEAN / ADMINISTRATOR PERSONA ("How Is The Institution Doing?") */}
          {role === 'ADMIN' && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-grid-1x2-fill text-primary"></i>
                <span>Institutional Command Center</span>
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
