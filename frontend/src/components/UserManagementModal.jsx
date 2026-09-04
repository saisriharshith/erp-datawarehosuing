import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from './ui/Button';

export default function UserManagementModal({ onClose }) {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Account Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'FACULTY',
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
      studentId: newRole === 'STUDENT' ? `STU${Date.now().toString().slice(-6)}` : '',
      facultyId: newRole === 'FACULTY' ? `FAC${Date.now().toString().slice(-4)}` : ''
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
      await fetchAPI('/auth/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (addToast) addToast(`Account created successfully for ${formData.name}!`, 'success');
      setShowAddForm(false);
      setFormData({
        name: '',
        email: '',
        role: 'FACULTY',
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

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden" style={{ backgroundColor: 'var(--bg-canvas, #0f172a)', color: 'var(--text-primary, #ffffff)' }}>
          {/* Modal Header */}
          <div className="modal-header px-4 py-3 border-bottom" style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(30, 41, 59, 0.7)' }}>
            <div className="d-flex align-items-center gap-2">
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}
              >
                <i className="bi bi-people-fill"></i>
              </span>
              <div>
                <h5 className="modal-title fs-6 fw-bold mb-0">Institutional User Management & Provisioning</h5>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                  Manage authorized Dean, Faculty, Bursar, and Student portal accounts
                </span>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4">
            {/* Top Toolbar */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
              {/* Search & Filter */}
              <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
                <div style={{ position: 'relative', minWidth: '220px', flexGrow: 1 }}>
                  <i
                    className="bi bi-search"
                    style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8', fontSize: '0.85rem' }}
                  ></i>
                  <input
                    type="text"
                    placeholder="Search by name, email, department, or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 36px',
                      fontSize: '0.85rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary, #ffffff)',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Role Filter Pills */}
                <div className="d-flex gap-1 bg-dark p-1 rounded-3 border" style={{ borderColor: 'var(--border-color)' }}>
                  {['ALL', 'ADMIN', 'FACULTY', 'ACCOUNTS', 'STUDENT'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRoleFilter(r)}
                      style={{
                        border: 'none',
                        backgroundColor: roleFilter === r ? '#4f46e5' : 'transparent',
                        color: roleFilter === r ? '#ffffff' : '#94a3b8',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
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
                style={{ padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              >
                <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-person-plus-fill'} me-2`}></i>
                {showAddForm ? 'Cancel Provisioning' : 'Provision New Account'}
              </Button>
            </div>

            {/* Account Provisioning Form Drawer */}
            {showAddForm && (
              <div
                className="p-4 mb-4 rounded-3 border"
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-shield-lock-fill text-primary"></i>
                  <h6 className="fw-bold mb-0 text-white">Create New Institutional Account</h6>
                </div>

                {formError && (
                  <div className="alert alert-danger py-2 small mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i> {formError}
                  </div>
                )}

                <form onSubmit={handleCreateAccount}>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-muted">Full Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Dr. Ramesh Kumar"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', color: '#fff', borderColor: 'var(--border-color)' }}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-muted">Institutional Email *</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        placeholder="e.g. ramesh.kumar@univ.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', color: '#fff', borderColor: 'var(--border-color)' }}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-muted">Institutional Role *</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', color: '#fff', borderColor: 'var(--border-color)' }}
                      >
                        <option value="FACULTY">FACULTY / HOD</option>
                        <option value="ADMIN">ADMIN / DEAN</option>
                        <option value="ACCOUNTS">ACCOUNTS & BURSAR</option>
                        <option value="STUDENT">STUDENT</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-muted">Department</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.departmentId}
                        onChange={(e) => handleDeptChange(e.target.value)}
                        style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', color: '#fff', borderColor: 'var(--border-color)' }}
                      >
                        <option value="DEPT_CSE">Computer Science & Engg</option>
                        <option value="DEPT_ECE">Electronics & Comm Engg</option>
                        <option value="DEPT_MECH">Mechanical Engg</option>
                        <option value="DEPT_CIVIL">Civil Engg</option>
                        <option value="DEPT_AIDS">AI & Data Science</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-muted">Initial Password</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-mono"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', color: '#fff', borderColor: 'var(--border-color)' }}
                      />
                    </div>

                    {formData.role === 'STUDENT' && (
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Student Roll ID</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-mono"
                          value={formData.studentId}
                          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                          placeholder="e.g. STU20260099"
                          style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', color: '#fff', borderColor: 'var(--border-color)' }}
                        />
                      </div>
                    )}

                    {formData.role === 'FACULTY' && (
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Faculty Staff ID</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-mono"
                          value={formData.facultyId}
                          onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                          placeholder="e.g. FAC508"
                          style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', color: '#fff', borderColor: 'var(--border-color)' }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm btn-primary"
                      disabled={submitting}
                      style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                    >
                      {submitting ? 'Creating...' : 'Confirm Provisioning'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users Table */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted small">Loading institutional directory...</p>
              </div>
            ) : (
              <div className="table-responsive rounded-3 border" style={{ borderColor: 'var(--border-color)' }}>
                <table className="table table-hover align-middle mb-0 small" style={{ color: 'var(--text-primary, #ffffff)' }}>
                  <thead style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', borderBottom: '1.5px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '10px 14px' }}>Name & Credentials</th>
                      <th style={{ padding: '10px 14px' }}>Role</th>
                      <th style={{ padding: '10px 14px' }}>Department</th>
                      <th style={{ padding: '10px 14px' }}>Identifier</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          No matching accounts found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            backgroundColor: 'transparent'
                          }}
                        >
                          <td style={{ padding: '10px 14px' }}>
                            <div className="fw-bold">{u.name}</div>
                            <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                              {u.email}
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              className="badge"
                              style={{
                                backgroundColor:
                                  u.role === 'ADMIN'
                                    ? 'rgba(99, 102, 241, 0.2)'
                                    : u.role === 'FACULTY'
                                    ? 'rgba(2, 132, 199, 0.2)'
                                    : u.role === 'ACCOUNTS'
                                    ? 'rgba(217, 119, 6, 0.2)'
                                    : 'rgba(16, 185, 129, 0.2)',
                                color:
                                  u.role === 'ADMIN'
                                    ? '#818cf8'
                                    : u.role === 'FACULTY'
                                    ? '#38bdf8'
                                    : u.role === 'ACCOUNTS'
                                    ? '#fbbf24'
                                    : '#34d399',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '4px 8px',
                                fontSize: '0.72rem'
                              }}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div>{u.department_name || 'Engineering'}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{u.department_id}</div>
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#94a3b8' }}>
                            {u.student_id || u.faculty_id || 'SYS_ADMIN'}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                            <div className="d-flex justify-content-end gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => {
                                  setResettingUser(u);
                                  setResetPasswordVal('Welcome@123');
                                }}
                                style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px' }}
                                title="Reset Password"
                              >
                                <i className="bi bi-key-fill me-1"></i> Reset Pass
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteUser(u.email)}
                                style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px' }}
                                title="Deactivate Account"
                              >
                                <i className="bi bi-trash3 me-1"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
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
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1090
                }}
              >
                <div
                  className="rounded-4 p-4 shadow-2xl border"
                  style={{
                    backgroundColor: 'var(--bg-canvas, #0f172a)',
                    maxWidth: '400px',
                    width: '90%',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-shield-lock-fill text-warning fs-5"></i>
                    <h6 className="fw-bold mb-0 text-white">Reset Account Password</h6>
                  </div>
                  <p className="small text-muted mb-3">
                    Setting new password for <strong>{resettingUser.name}</strong> ({resettingUser.email}).
                  </p>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">New Password *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={resetPasswordVal}
                      onChange={(e) => setResetPasswordVal(e.target.value)}
                      placeholder="e.g. Welcome@123"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        borderColor: 'var(--border-color)',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
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
          <div className="modal-footer px-4 py-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-muted small me-auto">
              Total Accounts: <strong>{users.length}</strong> (Filtered: {filteredUsers.length})
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
