import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchAPI } from '../services/api';
import { Button } from './ui/Button';

export default function ChangePasswordModal({ onClose }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await fetchAPI('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          email: user?.email,
          currentPassword,
          newPassword
        })
      });

      if (addToast) addToast('Password changed successfully! Please use it on your next login.', 'success');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update password. Please check your current password.');
      if (addToast) addToast(err.message || 'Password update failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1070 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
        <div
          className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-canvas, #0f172a)', color: 'var(--text-primary, #ffffff)' }}
        >
          {/* Header */}
          <div
            className="modal-header px-4 py-3 border-bottom"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(30, 41, 59, 0.7)' }}
          >
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
                  fontSize: '1.1rem'
                }}
              >
                <i className="bi bi-key-fill"></i>
              </span>
              <div>
                <h5 className="modal-title fs-6 fw-bold mb-0">Change Account Password</h5>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                  {user?.email || 'Institutional Account'}
                </span>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {error && (
              <div className="alert alert-danger py-2 small mb-3 d-flex align-items-center gap-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Current Password */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Current Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary, #ffffff)',
                      borderColor: 'var(--border-color)',
                      paddingRight: '40px',
                      borderRadius: '10px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    <i className={showCurrent ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'}></i>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">New Password (min. 6 characters) *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Enter new strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary, #ffffff)',
                      borderColor: 'var(--border-color)',
                      paddingRight: '40px',
                      borderRadius: '10px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    <i className={showNew ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'}></i>
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted">Confirm New Password *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-primary, #ffffff)',
                    borderColor:
                      confirmPassword && confirmPassword !== newPassword
                        ? '#ef4444'
                        : 'var(--border-color)',
                    borderRadius: '10px'
                  }}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={onClose}
                  style={{ borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={loading}
                  style={{ borderRadius: '8px', padding: '6px 16px', fontWeight: '700' }}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
