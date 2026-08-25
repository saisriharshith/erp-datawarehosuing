import React, { useState } from 'react';
import { useAuth, DEMO_PRESETS } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export default function PersonaSwitcherModal({ onClose }) {
  const { user, switchAccount } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const filtered = DEMO_PRESETS.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.badge && p.badge.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.dept && p.dept.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ADMIN') return p.role === 'ADMIN';
    if (activeTab === 'FACULTY') return p.role === 'FACULTY';
    if (activeTab === 'ACCOUNTS') return p.role === 'ACCOUNTS';
    if (activeTab === 'STUDENT') return p.role === 'STUDENT';
    return true;
  });

  const handleSelect = async (account) => {
    try {
      const loggedUser = await switchAccount(account.email);
      addToast(`Switched account to ${account.name}`, 'success');
      onClose();
      if (loggedUser.role === 'STUDENT') navigate('/student-portal');
      else if (loggedUser.role === 'FACULTY') navigate('/faculty-portal');
      else if (loggedUser.role === 'ACCOUNTS') navigate('/accounts');
      else navigate('/dashboard');
    } catch (err) {
      addToast(err.message || 'Failed to switch account', 'danger');
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header bg-dark text-white p-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <span className="fs-5 text-warning"><i className="bi bi-people-fill"></i></span>
              <div>
                <h5 className="modal-title fs-6 fw-bold mb-0">Role & Persona Switcher (22 Verified Accounts)</h5>
                <span className="text-white-50" style={{ fontSize: '0.75rem' }}>
                  Simulate any institutional perspective with 1-click
                </span>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4 bg-light">
            {/* Search Bar */}
            <div className="input-group input-group-sm mb-3 shadow-sm rounded-3 overflow-hidden border">
              <span className="input-group-text bg-white border-0"><i className="bi bi-search text-muted"></i></span>
              <input
                type="text"
                className="form-control border-0 py-2"
                placeholder="Search by name, department, role, or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            {/* Category Filter Pills */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              {[
                { key: 'ALL', label: 'All 22 Accounts' },
                { key: 'ADMIN', label: '👔 Leadership (2)' },
                { key: 'FACULTY', label: '👨‍🏫 Faculty & HODs (8)' },
                { key: 'ACCOUNTS', label: '💰 Accounts & Finance (2)' },
                { key: 'STUDENT', label: '🎓 Students (10)' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`btn btn-sm rounded-pill px-3 py-1 ${
                    activeTab === tab.key ? 'btn-primary text-white shadow-sm' : 'btn-white bg-white text-muted border'
                  }`}
                  style={activeTab === tab.key ? { background: '#4f46e5', borderColor: '#4f46e5' } : {}}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Account List Grid */}
            <div className="row g-2" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {filtered.map((acc) => {
                const isCurrent = user?.email === acc.email;
                return (
                  <div key={acc.email} className="col-12 col-md-6">
                    <div
                      className={`p-3 rounded-3 bg-white border h-100 d-flex align-items-center justify-content-between cursor-pointer transition-all ${
                        isCurrent ? 'border-primary bg-light shadow-sm' : 'hover-shadow'
                      }`}
                      style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                      onClick={() => handleSelect(acc)}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm ${
                            acc.role === 'ADMIN'
                              ? 'bg-primary'
                              : acc.role === 'FACULTY'
                              ? 'bg-info text-dark'
                              : acc.role === 'ACCOUNTS'
                              ? 'bg-warning text-dark'
                              : 'bg-success'
                          }`}
                          style={{ width: '38px', height: '38px', fontSize: '0.85rem' }}
                        >
                          {acc.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold small text-dark">{acc.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {acc.email}
                          </div>
                        </div>
                      </div>

                      <div className="text-end">
                        <span
                          className={`badge ${
                            acc.role === 'ADMIN'
                              ? 'bg-light text-primary border'
                              : acc.role === 'FACULTY'
                              ? 'bg-light text-info text-dark border'
                              : acc.role === 'ACCOUNTS'
                              ? 'bg-light text-warning text-dark border'
                              : 'bg-light text-success border'
                          }`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {acc.badge || acc.role}
                        </span>
                        {isCurrent && (
                          <div className="text-primary small fw-bold mt-1" style={{ fontSize: '0.65rem' }}>
                            <i className="bi bi-check2-circle me-1"></i> Active
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="modal-footer bg-white p-3">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
