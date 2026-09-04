import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ThemeToggle } from './layout/ThemeToggle';
import UserManagementModal from './UserManagementModal';
import ChangePasswordModal from './ChangePasswordModal';

export function Navbar({ onToggleMobileSidebar }) {
  const { user, dbHealth, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [showUsers, setShowUsers] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Mandatory Attendance Compliance',
      description: 'Minimum 75% aggregate attendance required to obtain End-Semester Hall Ticket.',
      category: 'Attendance',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 2,
      title: 'Semester Mid-Term Examination Schedule',
      description: 'Mid-term assessment timetable published by Controller of Examinations.',
      category: 'Examination',
      time: '4 hours ago',
      unread: true
    },
    {
      id: 3,
      title: 'Institutional Fee Settlement Notice',
      description: 'Tuition fee installment deadline approaching. Verify status in Fee Ledger.',
      category: 'Finance',
      time: '1 day ago',
      unread: false
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    addToast('All notifications marked as read', 'info');
  };

  const getRoleBadge = () => {
    if (!user) return null;
    const role = user.role;
    if (role === 'ADMIN') {
      return (
        <span
          className="badge"
          style={{
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '5px 10px',
            borderRadius: '20px'
          }}
        >
          <i className="bi bi-shield-fill-check me-1"></i> Admin (All Records)
        </span>
      );
    }
    if (role === 'FACULTY') {
      return (
        <span
          className="badge"
          style={{
            backgroundColor: 'rgba(2, 132, 199, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(2, 132, 199, 0.3)',
            padding: '5px 10px',
            borderRadius: '20px'
          }}
        >
          <i className="bi bi-person-workspace me-1"></i> Faculty ({user.department_id || 'Dept'})
        </span>
      );
    }
    if (role === 'ACCOUNTS') {
      return (
        <span
          className="badge"
          style={{
            backgroundColor: 'rgba(217, 119, 6, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            padding: '5px 10px',
            borderRadius: '20px'
          }}
        >
          <i className="bi bi-wallet2 me-1"></i> Accounts & Bursar
        </span>
      );
    }
    return (
      <span
        className="badge"
        style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '5px 10px',
          borderRadius: '20px'
        }}
      >
        <i className="bi bi-mortarboard-fill me-1"></i> Student ({user.student_id || 'STU'})
      </span>
    );
  };

  const getInitials = (name = 'User') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name[0] || 'U').toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    if (addToast) addToast('Signed out of session', 'info');
    navigate('/login');
  };

  const getPortalSubtitle = () => {
    if (!user) return 'College Information Management System';
    if (user.role === 'STUDENT') return 'Student Portal';
    if (user.role === 'FACULTY') return 'Faculty Portal';
    if (user.role === 'ACCOUNTS') return 'Accounts & Fees Portal';
    return 'Admin Portal';
  };

  return (
    <>
      <nav
        className="navbar px-3 py-2 sticky-top d-print-none"
        style={{
          backgroundColor: 'var(--surface-card, #ffffff)',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          zIndex: 1020,
          boxShadow: 'var(--shadow-surface)'
        }}
      >
        <div className="container-fluid d-flex align-items-center justify-content-between p-0">
          {/* Left: Mobile Toggle & Institutional Branding */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            {/* Mobile Hamburger Button */}
            <button
              className="btn btn-sm btn-outline-secondary d-lg-none d-flex align-items-center justify-content-center"
              style={{ width: '38px', height: '38px', borderRadius: '8px' }}
              onClick={onToggleMobileSidebar}
              aria-label="Toggle navigation menu"
            >
              <i className="bi bi-list fs-5"></i>
            </button>

            {/* University Crest & Title */}
            <div className="d-flex align-items-center gap-2">
              <span
                style={{
                  width: '38px',
                  height: '38px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)'
                }}
              >
                <i className="bi bi-mortarboard-fill"></i>
              </span>
              <div>
                <span className="fw-bold fs-6 d-block leading-tight" style={{ color: 'var(--text-primary)' }}>
                  UnivAnalytics ERP
                </span>
                <span className="d-none d-sm-block" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {getPortalSubtitle()}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions, Notifications, Profile */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            {/* Admin User Accounts Management */}
            {user?.role === 'ADMIN' && (
              <button
                className="btn btn-sm btn-outline-secondary d-none d-md-flex align-items-center gap-1"
                onClick={() => setShowUsers(true)}
                style={{
                  borderRadius: '8px',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem'
                }}
                title="Manage Institutional User Accounts"
              >
                <i className="bi bi-people-fill text-primary"></i>
                <span>User Accounts</span>
              </button>
            )}

            {/* Notification Center Dropdown */}
            <div className="position-relative">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary position-relative d-flex align-items-center justify-content-center"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
                onClick={() => setShowNotifications(!showNotifications)}
                title="Campus Notices & Notifications"
              >
                <i className="bi bi-bell-fill"></i>
                {unreadCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: '0.65rem' }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div
                  className="position-absolute end-0 mt-2 shadow-lg border rounded-4 p-0 overflow-hidden"
                  style={{
                    width: '320px',
                    maxWidth: '90vw',
                    backgroundColor: 'var(--surface-card, #ffffff)',
                    borderColor: 'var(--border-color, #e2e8f0)',
                    zIndex: 1060
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-body-tertiary">
                    <div>
                      <h6 className="fw-bold mb-0" style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>Institutional Alerts</h6>
                      <span className="text-muted" style={{ fontSize: '0.7rem' }}>{unreadCount} unread announcements</span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none"
                        style={{ fontSize: '0.75rem' }}
                        onClick={markAllAsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-3 border-bottom ${n.unread ? 'bg-primary-subtle bg-opacity-10' : ''}`}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <span className="badge bg-secondary text-white" style={{ fontSize: '0.65rem' }}>
                            {n.category}
                          </span>
                          <span className="text-muted" style={{ fontSize: '0.68rem' }}>{n.time}</span>
                        </div>
                        <div className="fw-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                          {n.title}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
                          {n.description}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-2 text-center bg-body-tertiary border-top">
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-decoration-none w-100"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setShowNotifications(false)}
                    >
                      Close Notification Center
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Role Badge */}
            <div className="d-none d-sm-block">
              {getRoleBadge()}
            </div>

            {/* User Profile Avatar & Actions */}
            <div className="d-flex align-items-center gap-2 ps-2 border-start" style={{ borderColor: 'var(--border-color)' }}>
              {/* Avatar Initials Circle */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: user?.role === 'ADMIN' ? 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
                title={user?.role === 'ADMIN' ? 'Admin — All Institutional Records' : (user?.name || 'User Profile')}
              >
                {user?.role === 'ADMIN' ? 'AD' : getInitials(user?.name)}
              </div>

              {/* User Name and ID (Desktop) */}
              <div className="d-none d-xl-block text-start" style={{ lineHeight: '1.2' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {user?.role === 'ADMIN' ? 'Admin' : (user?.name || 'Institutional User')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {user?.role === 'ADMIN' ? 'All Institutional Records' : (user?.student_id || user?.faculty_id || user?.email)}
                </div>
              </div>

              {/* Password Change Button */}
              <button
                className="btn btn-sm btn-outline-secondary d-none d-md-flex align-items-center justify-content-center"
                onClick={() => setShowPasswordModal(true)}
                title="Change Password"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                <i className="bi bi-key-fill text-warning"></i>
              </button>

              {/* Sign Out Button */}
              <button
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                onClick={handleLogout}
                title="Sign Out of Session"
                style={{ borderRadius: '8px', fontSize: '0.78rem' }}
              >
                <i className="bi bi-box-arrow-right"></i>
                <span className="d-none d-md-inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      {showUsers && <UserManagementModal onClose={() => setShowUsers(false)} />}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </>
  );
}

export default Navbar;
