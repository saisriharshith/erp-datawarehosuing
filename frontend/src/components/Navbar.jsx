import React, { useState } from 'react';
import { useAuth, DEMO_PRESETS } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import ETLModal from './ETLModal';
import LineageModal from './LineageModal';
import PersonaSwitcherModal from './PersonaSwitcherModal';

export default function Navbar() {
  const { user, dbHealth, switchAccount, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [showETL, setShowETL] = useState(false);
  const [showLineage, setShowLineage] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);

  const handleAccountChange = async (e) => {
    const email = e.target.value;
    if (!email) return;
    try {
      const newUser = await switchAccount(email);
      addToast(`Switched to ${newUser.name}`, 'success');
      if (newUser.role === 'STUDENT') navigate('/student-portal');
      else if (newUser.role === 'FACULTY') navigate('/faculty-portal');
      else navigate('/dashboard');
    } catch (err) {
      addToast(err.message, 'danger');
    }
  };

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === 'ADMIN') return <span className="badge bg-primary">Admin / Dean</span>;
    if (user.role === 'FACULTY') return <span className="badge bg-info text-dark">Faculty ({user.department_id || 'CSE'})</span>;
    return <span className="badge bg-success">Student ({user.student_id || 'STU'})</span>;
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg app-navbar px-3 py-2 sticky-top d-print-none">
        <div className="container-fluid">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-4 text-primary"><i className="bi bi-mortarboard-fill"></i></span>
            <div>
              <span className="fw-bold fs-6 text-dark d-block leading-tight">UnivAnalytics MERN</span>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>Institutional Decision Support & DW</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 gap-md-3 ms-auto">
            {/* MongoDB Atlas Indicator */}
            <div className="d-none d-lg-flex align-items-center gap-2 px-2 py-1 bg-light rounded border text-muted small">
              <span className={`badge p-1 rounded-circle ${dbHealth?.mongodb_connected ? 'bg-success' : 'bg-warning'}`}> </span>
              <span style={{ fontSize: '0.75rem' }}>{dbHealth?.mongodb_connected ? 'MongoDB Atlas Online' : 'Snapshot Cache'}</span>
            </div>

            {/* Live Lineage Trigger */}
            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => setShowLineage(true)}>
              <i className="bi bi-diagram-3-fill text-indigo"></i>
              <span className="d-none d-sm-inline">Lineage</span>
            </button>

            {/* Live ETL Trigger */}
            {user?.role === 'ADMIN' && (
              <button className="btn btn-sm btn-primary d-flex align-items-center gap-1" onClick={() => setShowETL(true)} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
                <i className="bi bi-lightning-charge-fill text-warning"></i>
                <span className="d-none d-sm-inline">Run Live ETL</span>
                <span className="d-inline d-sm-none">ETL</span>
              </button>
            )}

            {/* 20 Account Quick Switcher Button & Dropdown */}
            <div className="d-flex align-items-center gap-1">
              <button
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                onClick={() => setShowPersonaModal(true)}
                title="Browse all 20 demo accounts"
              >
                <i className="bi bi-person-gear"></i>
                <span className="d-none d-md-inline">20 Accounts</span>
              </button>

              <select
                className="form-select form-select-sm d-none d-xl-block"
                style={{ width: '220px', fontSize: '0.8rem' }}
                value={user?.email || ''}
                onChange={handleAccountChange}
              >
                <optgroup label="👔 Leadership / Admin (2)">
                  {DEMO_PRESETS.filter(p => p.role === 'ADMIN').map(p => (
                    <option key={p.email} value={p.email}>{p.name}</option>
                  ))}
                </optgroup>
                <optgroup label="👨‍🏫 Faculty / HODs (8)">
                  {DEMO_PRESETS.filter(p => p.role === 'FACULTY').map(p => (
                    <option key={p.email} value={p.email}>{p.name}</option>
                  ))}
                </optgroup>
                <optgroup label="🎓 Students (10)">
                  {DEMO_PRESETS.filter(p => p.role === 'STUDENT').map(p => (
                    <option key={p.email} value={p.email}>{p.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* User Profile & Logout */}
            <div className="d-flex align-items-center gap-2">
              {getRoleBadge()}
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => {
                  logout();
                  addToast('Signed out of session', 'info');
                }}
                title="Sign Out"
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showETL && <ETLModal onClose={() => setShowETL(false)} />}
      {showLineage && <LineageModal onClose={() => setShowLineage(false)} />}
      {showPersonaModal && <PersonaSwitcherModal onClose={() => setShowPersonaModal(false)} />}
    </>
  );
}
