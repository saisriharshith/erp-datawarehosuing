import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from './ui/Button';

export default function UserManagementModal({ onClose, defaultOpenAdd = false, initialRole = 'STUDENT' }) {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState(defaultOpenAdd ? initialRole : 'ALL');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(defaultOpenAdd);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // New Account Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: initialRole,
    departmentId: 'DEPT_CSE',
    departmentName: 'Computer Science & Engineering',
    studentId: '',
    facultyId: '',
    password: 'Welcome@123'
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/auth/users');
      setUsers(res || []);
    } catch (err) {
      console.error(err);
      if (addToast) addToast('Failed to load accounts list', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = (newRole) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      studentId: '',
      facultyId: ''
    }));
  };

  const handleDeptChange = (deptId) => {
    const deptMap = {
      DEPT_CSE: 'Computer Science & Engineering',
      DEPT_ECE: 'Electronics & Communication',
      DEPT_MECH: 'Mechanical Engineering',
      DEPT_CIVIL: 'Civil Engineering',
      DEPT_AIDS: 'Artificial Intelligence & Data Science'
    };
    setFormData((prev) => ({
      ...prev,
      departmentId: deptId,
      departmentName: deptMap[deptId] || 'Engineering'
    }));
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Full name and institutional email are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      // Don't send studentId or facultyId — backend auto-generates them
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        departmentId: formData.departmentId,
        departmentName: formData.departmentName,
        password: formData.password
      };

      const res = await fetchAPI('/auth/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const generatedId = res?.student_id || res?.faculty_id || '';
      const idLabel = generatedId ? ` — Roll No: ${generatedId}` : '';
      if (addToast) addToast(`Account created successfully for ${formData.name}${idLabel}!`, 'success');
      setShowAddForm(false);
      setFormData({
        name: '',
        email: '',
        role: 'STUDENT',
        departmentId: 'DEPT_CSE',
        departmentName: 'Computer Science & Engineering',
        studentId: '',
        facultyId: '',
        password: 'Welcome@123'
      });
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to create account.');
      if (addToast) addToast(err.message || 'Failed to create account', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const [resettingUser, setResettingUser] = useState(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('Welcome@123');
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!resettingUser) return;
    if (!resetPasswordVal || resetPasswordVal.length < 6) {
      if (addToast) addToast('New password must be at least 6 characters', 'warning');
      return;
    }

    setResetLoading(true);
    try {
      await fetchAPI(`/auth/users/${encodeURIComponent(resettingUser.email)}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: resetPasswordVal })
      });
      if (addToast) addToast(`Password reset successfully for ${resettingUser.name} to "${resetPasswordVal}"`, 'success');
      setResettingUser(null);
      setResetPasswordVal('Welcome@123');
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to reset password', 'danger');
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteUser = async (email) => {
    if (!window.confirm(`Are you sure you want to deactivate account for ${email}?`)) return;

    try {
      await fetchAPI(`/auth/users/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      if (addToast) addToast(`Deactivated ${email}`, 'info');
      loadUsers();
    } catch (err) {
      if (addToast) addToast('Failed to deactivate account', 'danger');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.department_name?.toLowerCase().includes(q) ||
      u.student_id?.toLowerCase().includes(q) ||
      u.faculty_id?.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const getInitials = (name = 'User') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name[0] || 'U').toUpperCase();
  };

  const getRoleBadgeStyle = (r) => {
    switch (r) {
      case 'ADMIN':
        return { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.35)', icon: 'bi-shield-fill' };
      case 'FACULTY':
        return { bg: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', border: 'rgba(2, 132, 199, 0.35)', icon: 'bi-person-workspace' };
      case 'ACCOUNTS':
        return { bg: 'rgba(217, 119, 6, 0.15)', color: '#fbbf24', border: 'rgba(217, 119, 6, 0.35)', icon: 'bi-wallet2' };
      case 'STUDENT':
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.35)', icon: 'bi-mortarboard-fill' };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? '0' : '20px',
        boxSizing: 'border-box'
      }}
      tabIndex="-1"
    >
      <div
        style={{
          width: isFullscreen ? '100vw' : '96vw',
          maxWidth: isFullscreen ? '100vw' : '1560px',
          height: isFullscreen ? '100vh' : '92vh',
          maxHeight: isFullscreen ? '100vh' : '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: isFullscreen ? '0' : '16px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        {/* Modal Header */}
        <div
          className="px-4 py-3 d-flex align-items-center justify-content-between"
          style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(30, 41, 59, 0.85)',
            flexShrink: 0
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <span
              style={{
                width: '42px',
                height: '42px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)'
              }}
            >
              <i className="bi bi-people-fill"></i>
            </span>
            <div>
              <h5 className="fs-5 fw-bold mb-0 text-white">
                Institutional User Management & Provisioning
              </h5>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Unified directory control across Executive Leadership, Faculty & HODs, Bursar Office, and Students
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5"
              style={{
                borderRadius: '8px',
                color: '#e2e8f0',
                borderColor: 'rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                padding: '6px 12px',
                fontSize: '0.8rem'
              }}
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Restore Window Size' : 'Maximize to Full Screen'}
              aria-label="Toggle Fullscreen"
            >
              <i className={`bi ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}`}></i>
              <span className="d-none d-sm-inline">{isFullscreen ? 'Restore' : 'Maximize'}</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171'
              }}
              onClick={onClose}
              aria-label="Close modal"
              title="Close Window"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          className="p-4"
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            backgroundColor: '#0b1120'
          }}
        >
          {/* 1. High-Level Metrics Strip */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-sm-3 col-xl">
              <div
                className="p-3 rounded-3 border"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderColor: 'rgba(255, 255, 255, 0.08)'
                }}
              >
                <div className="small fw-semibold text-uppercase text-muted" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                  Total Directory
                </div>
                <div className="fs-4 fw-bold text-white mt-1">{users.length}</div>
              </div>
            </div>
            <div className="col-6 col-sm-3 col-xl">
              <div
                className="p-3 rounded-3 border"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  borderColor: 'rgba(99, 102, 241, 0.25)'
                }}
              >
                <div className="small fw-semibold text-uppercase" style={{ fontSize: '0.72rem', color: '#818cf8', letterSpacing: '0.04em' }}>
                  Administrators
                </div>
                <div className="fs-4 fw-bold mt-1" style={{ color: '#818cf8' }}>
                  {users.filter((u) => u.role === 'ADMIN').length}
                </div>
              </div>
            </div>
            <div className="col-6 col-sm-3 col-xl">
              <div
                className="p-3 rounded-3 border"
                style={{
                  backgroundColor: 'rgba(2, 132, 199, 0.08)',
                  borderColor: 'rgba(2, 132, 199, 0.25)'
                }}
              >
                <div className="small fw-semibold text-uppercase" style={{ fontSize: '0.72rem', color: '#38bdf8', letterSpacing: '0.04em' }}>
                  Faculty & HODs
                </div>
                <div className="fs-4 fw-bold mt-1" style={{ color: '#38bdf8' }}>
                  {users.filter((u) => u.role === 'FACULTY').length}
                </div>
              </div>
            </div>
            <div className="col-6 col-sm-3 col-xl">
              <div
                className="p-3 rounded-3 border"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  borderColor: 'rgba(16, 185, 129, 0.25)'
                }}
              >
                <div className="small fw-semibold text-uppercase" style={{ fontSize: '0.72rem', color: '#34d399', letterSpacing: '0.04em' }}>
                  Enrolled Students
                </div>
                <div className="fs-4 fw-bold mt-1" style={{ color: '#34d399' }}>
                  {users.filter((u) => u.role === 'STUDENT').length}
                </div>
              </div>
            </div>
            <div className="col-6 col-sm-3 col-xl">
              <div
                className="p-3 rounded-3 border"
                style={{
                  backgroundColor: 'rgba(217, 119, 6, 0.08)',
                  borderColor: 'rgba(217, 119, 6, 0.25)'
                }}
              >
                <div className="small fw-semibold text-uppercase" style={{ fontSize: '0.72rem', color: '#fbbf24', letterSpacing: '0.04em' }}>
                  Finance & Bursar
                </div>
                <div className="fs-4 fw-bold mt-1" style={{ color: '#fbbf24' }}>
                  {users.filter((u) => u.role === 'ACCOUNTS').length}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Top Toolbar (Search, Filter Pills & Provisioning Trigger) */}
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
            {/* Search & Filter */}
            <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
              <div style={{ position: 'relative', minWidth: '300px', flexGrow: 1 }}>
                <i
                  className="bi bi-search"
                  style={{ position: 'absolute', left: '14px', top: '11px', color: '#94a3b8', fontSize: '0.9rem' }}
                ></i>
                <input
                  type="text"
                  placeholder="Search by name, institutional email, department, or student/staff ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 14px 9px 38px',
                    fontSize: '0.88rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Role Filter Pills */}
              <div
                className="d-flex gap-1 p-1 rounded-3 border"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: 'rgba(255, 255, 255, 0.12)'
                }}
              >
                {['ALL', 'ADMIN', 'FACULTY', 'ACCOUNTS', 'STUDENT'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleFilter(r)}
                    style={{
                      border: 'none',
                      backgroundColor: roleFilter === r ? '#4f46e5' : 'transparent',
                      color: roleFilter === r ? '#ffffff' : '#94a3b8',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: roleFilter === r ? '700' : '500',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Provision Button */}
            <Button
              variant="primary"
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.88rem',
                whiteSpace: 'nowrap'
              }}
            >
              <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-person-plus-fill'} me-2`}></i>
              {showAddForm ? 'Cancel Provisioning' : 'Provision New Account'}
            </Button>
          </div>

          {/* 3. Provisioning Form Drawer */}
          {showAddForm && (
            <div
              className="p-4 mb-4 rounded-3 border"
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.75)',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-shield-lock-fill text-primary fs-5"></i>
                <h6 className="fw-bold mb-0 text-white fs-6">Provision New Institutional Account</h6>
              </div>

              {formError && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i> {formError}
                </div>
              )}

              <form onSubmit={handleCreateAccount}>
                <div className="row g-3">
                  <div className="col-12 col-md-6 col-lg-4">
                    <label className="form-label small fw-bold text-muted">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        color: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.15)'
                      }}
                    />
                  </div>

                  <div className="col-12 col-md-6 col-lg-4">
                    <label className="form-label small fw-bold text-muted">Institutional Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. ramesh.kumar@univ.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        color: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.15)'
                      }}
                    />
                  </div>

                  <div className="col-12 col-md-6 col-lg-4">
                    <label className="form-label small fw-bold text-muted">Institutional Role *</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        color: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.15)'
                      }}
                    >
                      <option value="FACULTY">FACULTY / HOD</option>
                      <option value="ADMIN">ADMIN / DEAN</option>
                      <option value="ACCOUNTS">ACCOUNTS & BURSAR</option>
                      <option value="STUDENT">STUDENT</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6 col-lg-4">
                    <label className="form-label small fw-bold text-muted">Department</label>
                    <select
                      className="form-select"
                      value={formData.departmentId}
                      onChange={(e) => handleDeptChange(e.target.value)}
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        color: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.15)'
                      }}
                    >
                      <option value="DEPT_CSE">Computer Science & Engg</option>
                      <option value="DEPT_ECE">Electronics & Comm Engg</option>
                      <option value="DEPT_MECH">Mechanical Engg</option>
                      <option value="DEPT_CIVIL">Civil Engg</option>
                      <option value="DEPT_AIDS">AI & Data Science</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6 col-lg-4">
                    <label className="form-label small fw-bold text-muted">Initial Password</label>
                    <input
                      type="text"
                      className="form-control font-mono"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        color: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.15)'
                      }}
                    />
                  </div>

                  {formData.role === 'STUDENT' && (
                    <div className="col-12 col-md-6 col-lg-4">
                      <label className="form-label small fw-bold text-muted">Student Roll No.</label>
                      <div
                        className="form-control d-flex align-items-center gap-2"
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                          color: '#34d399',
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                          fontSize: '0.88rem',
                          fontFamily: 'monospace',
                          cursor: 'default'
                        }}
                      >
                        <i className="bi bi-magic text-success"></i>
                        <span>Auto-generated on submit</span>
                      </div>
                      <div className="form-text" style={{ color: '#64748b', fontSize: '0.72rem' }}>
                        Format: STU{new Date().getFullYear()}{'{DEPT}'}{'{SEQ}'} — e.g. STU2026CSE001
                      </div>
                    </div>
                  )}

                  {formData.role === 'FACULTY' && (
                    <div className="col-12 col-md-6 col-lg-4">
                      <label className="form-label small fw-bold text-muted">Faculty Staff ID</label>
                      <input
                        type="text"
                        className="form-control font-mono"
                        value={formData.facultyId}
                        onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                        placeholder="e.g. FAC508"
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          color: '#fff',
                          borderColor: 'rgba(255, 255, 255, 0.15)'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-3"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold"
                    disabled={submitting}
                    style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                  >
                    {submitting ? 'Creating...' : 'Confirm Provisioning'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. Users Master Table */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted small">Loading institutional directory...</p>
            </div>
          ) : (
            <div
              className="table-responsive rounded-3 border"
              style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <table className="table table-hover align-middle mb-0 small" style={{ color: '#ffffff' }}>
                <thead
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    borderBottom: '1.5px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <tr>
                    <th style={{ padding: '12px 18px', width: '32%' }}>Name & Account Credentials</th>
                    <th style={{ padding: '12px 16px', width: '15%' }}>Institutional Role</th>
                    <th style={{ padding: '12px 16px', width: '22%' }}>Department & Division</th>
                    <th style={{ padding: '12px 16px', width: '16%' }}>Identifier</th>
                    <th style={{ padding: '12px 18px', width: '15%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-2 d-block mb-2 text-muted opacity-50"></i>
                        No matching accounts found for query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => {
                      const roleStyle = getRoleBadgeStyle(u.role);

                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            backgroundColor: 'transparent'
                          }}
                        >
                          <td style={{ padding: '12px 18px' }}>
                            <div className="d-flex align-items-center gap-3">
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  backgroundColor: roleStyle.bg,
                                  color: roleStyle.color,
                                  border: `1px solid ${roleStyle.border}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '700',
                                  fontSize: '0.8rem',
                                  flexShrink: 0
                                }}
                              >
                                {getInitials(u.name)}
                              </div>
                              <div className="text-truncate">
                                <div className="fw-bold text-white fs-6">{u.name}</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              className="badge rounded-pill d-inline-flex align-items-center gap-1.5"
                              style={{
                                backgroundColor: roleStyle.bg,
                                color: roleStyle.color,
                                border: `1px solid ${roleStyle.border}`,
                                padding: '5px 10px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}
                            >
                              <i className={`bi ${roleStyle.icon}`}></i>
                              <span>{u.role}</span>
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div className="text-white fw-medium">{u.department_name || 'Academic Directorate'}</div>
                            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{u.department_id || 'GENERAL'}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#cbd5e1' }}>
                            <span
                              className="badge font-mono"
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#cbd5e1',
                                fontSize: '0.75rem',
                                padding: '4px 8px'
                              }}
                            >
                              {u.student_id || u.faculty_id || u.user_id || 'SYS_ADMIN'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                            <div className="d-flex justify-content-end gap-1.5">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => {
                                  setResettingUser(u);
                                  setResetPasswordVal('Welcome@123');
                                }}
                                style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '7px' }}
                                title="Reset Password"
                              >
                                <i className="bi bi-key-fill me-1"></i> Reset Pass
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteUser(u.email)}
                                style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '7px' }}
                                title="Deactivate Account"
                              >
                                <i className="bi bi-trash3"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Reset Password Sub-Modal */}
          {resettingUser && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100000
              }}
            >
              <div
                className="rounded-4 p-4 shadow-2xl border"
                style={{
                  backgroundColor: '#0f172a',
                  maxWidth: '440px',
                  width: '90%',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-shield-lock-fill text-warning fs-5"></i>
                  <h6 className="fw-bold mb-0 text-white fs-6">Reset Account Password</h6>
                </div>
                <p className="small text-muted mb-3">
                  Setting new password for <strong>{resettingUser.name}</strong> ({resettingUser.email}).
                </p>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">New Password *</label>
                  <input
                    type="text"
                    className="form-control font-mono"
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    placeholder="e.g. Welcome@123"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      borderColor: 'rgba(255, 255, 255, 0.15)'
                    }}
                  />
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary px-3"
                    onClick={() => setResettingUser(null)}
                  >
                    Cancel
                  </button>
                  <Button
                    type="button"
                    variant="warning"
                    size="sm"
                    loading={resetLoading}
                    onClick={handleResetPassword}
                  >
                    {resetLoading ? 'Updating...' : 'Confirm Reset'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="px-4 py-3 d-flex justify-content-between align-items-center"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(30, 41, 59, 0.65)',
            flexShrink: 0
          }}
        >
          <span className="text-muted small">
            Total Accounts: <strong className="text-white">{users.length}</strong> (Filtered:{' '}
            <strong className="text-white">{filteredUsers.length}</strong>)
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm px-4 fw-medium"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
