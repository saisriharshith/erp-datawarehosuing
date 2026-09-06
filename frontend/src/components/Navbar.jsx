import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserManagementModal from './UserManagementModal';
import ChangePasswordModal from './ChangePasswordModal';

export function Navbar() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUsers, setShowUsers] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const role = user?.role || 'STUDENT';

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || (document.documentElement.getAttribute('data-theme') || 'light');
  });

  const handleThemeToggle = () => {
    const current = document.documentElement.getAttribute('data-theme') || theme || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.setAttribute('data-bs-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  // Notifications state
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Attendance Compliance Alert',
      description: 'Minimum 75% aggregate attendance required for semester examinations.',
      time: '1h ago',
      unread: true
    },
    {
      id: 2,
      title: 'Examination Timetable Released',
      description: 'Mid-term assessment schedule has been published.',
      time: '4h ago',
      unread: true
    },
    {
      id: 3,
      title: 'Fee Installment Notice',
      description: 'Tuition settlement deadline scheduled for Sep 15.',
      time: '1d ago',
      unread: false
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    if (addToast) addToast('All notices marked as read', 'info');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to check if a navigation item is currently active
  const isNavActive = (path, tabKey) => {
    if (tabKey) {
      if (location.pathname === path) {
        const searchParams = new URLSearchParams(location.search);
        const currentTab = searchParams.get('tab');
        if (currentTab) return currentTab === tabKey;
        return (tabKey === 'overview' && path === '/student-portal') || 
               (tabKey === 'roster' && path === '/faculty-portal');
      }
      return false;
    }
    return location.pathname === path;
  };

  // Role Navigation Links (concise, streamlined labels that fit comfortably)
  const getNavLinks = () => {
    if (role === 'ADMIN') {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: 'bi-grid-1x2-fill' },
        { label: 'Student Records', path: '/students', icon: 'bi-people-fill' },
        { label: 'Faculty Workspace', path: '/faculty', icon: 'bi-person-workspace' },
        { label: 'Tuition & Finance', path: '/accounts', icon: 'bi-wallet2' },
      ];
    }

    if (role === 'FACULTY') {
      return [
        { label: 'Dashboard', path: '/faculty-portal', tab: 'roster', icon: 'bi-speedometer2' },
        { label: 'Attendance', path: '/faculty-attendance', tab: 'attendance', icon: 'bi-check2-square' },
        { label: 'Enter Marks', path: '/faculty-marks', tab: 'marks', icon: 'bi-pencil-square' },
        { label: 'Alerts', path: '/faculty-alerts', tab: 'warnings', icon: 'bi-exclamation-triangle-fill' },
        { label: 'Mentoring', path: '/faculty-mentoring', tab: 'mentoring', icon: 'bi-chat-left-text-fill' },
      ];
    }

    if (role === 'ACCOUNTS') {
      return [
        { label: 'Tuition & Ledger', path: '/accounts', icon: 'bi-wallet2' },
        { label: 'Students Master', path: '/students', icon: 'bi-people-fill' },
      ];
    }

    // Default: STUDENT
    return [
      { label: 'Dashboard', path: '/student-portal', tab: 'overview', icon: 'bi-grid-fill' },
      { label: 'Attendance', path: '/attendance', tab: 'attendance', icon: 'bi-calendar-check-fill' },
      { label: 'Marks', path: '/marks', tab: 'marks', icon: 'bi-journal-bookmark-fill' },
      { label: 'Subjects', path: '/subjects', tab: 'subjects', icon: 'bi-collection-fill' },
      { label: 'Timetable', path: '/timetable', tab: 'schedule', icon: 'bi-clock-history' },
      { label: 'Fees', path: '/fees', tab: 'fees', icon: 'bi-receipt' },
      { label: 'Notices', path: '/notices', tab: 'notices', icon: 'bi-megaphone-fill' },
    ];
  };

  const navLinks = getNavLinks();

  const getInitials = (name = 'User') => {
    if (role === 'ADMIN') return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name[0] || 'U').toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    if (addToast) addToast('Signed out of session', 'info');
    navigate('/login');
  };

  // Dynamic badge color per role
  const roleBadgeStyle = {
    ADMIN: { bg: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', border: 'rgba(79, 70, 229, 0.3)' },
    FACULTY: { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: 'rgba(245, 158, 11, 0.3)' },
    ACCOUNTS: { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: 'rgba(16, 185, 129, 0.3)' },
    STUDENT: { bg: 'rgba(14, 165, 233, 0.12)', color: '#0284c7', border: 'rgba(14, 165, 233, 0.3)' },
  }[role] || { bg: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', border: 'rgba(99, 102, 241, 0.3)' };

  return (
    <>
      <header
        className="sticky-top d-print-none"
        style={{
          backgroundColor: 'var(--surface-glass, rgba(255, 255, 255, 0.92))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          zIndex: 1030,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          height: '60px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div className="container-fluid px-3 px-lg-4 d-flex align-items-center justify-content-between gap-2">
          
          {/* 1. Left: Compact Institutional Brand */}
          <NavLink
            to="/"
            className="d-flex align-items-center gap-2 text-decoration-none flex-shrink-0"
            style={{ color: 'inherit' }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
                color: '#ffffff',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                boxShadow: '0 3px 10px rgba(79, 70, 229, 0.35)'
              }}
            >
              <i className="bi bi-mortarboard-fill"></i>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <span
                className="fw-bold"
                style={{
                  fontSize: '1.02rem',
                  color: 'var(--text-primary, #0f172a)',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap'
                }}
              >
                UnivAnalytics
              </span>
              <span
                className="badge rounded-pill d-none d-sm-inline-block"
                style={{
                  fontSize: '0.66rem',
                  fontWeight: '600',
                  padding: '2px 7px',
                  backgroundColor: roleBadgeStyle.bg,
                  color: roleBadgeStyle.color,
                  border: `1px solid ${roleBadgeStyle.border}`
                }}
              >
                {role}
              </span>
            </div>
          </NavLink>

          {/* 2. Center: Sleek, Proportionate Navigation (Shown >= md, horizontally scrollable if space-constrained) */}
          <nav
            className="d-none d-md-flex align-items-center gap-1 mx-2 flex-grow-1 justify-content-center"
            style={{
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              whiteSpace: 'nowrap',
              flexWrap: 'nowrap',
              maxWidth: '850px'
            }}
          >
            {navLinks.map((item, idx) => {
              const active = isNavActive(item.path, item.tab);
              const destination = item.tab && item.path.includes('-portal') ? `${item.path}?tab=${item.tab}` : item.path;

              return (
                <NavLink
                  key={idx}
                  to={destination}
                  className="d-inline-flex align-items-center gap-1.5 text-decoration-none transition-all"
                  style={{
                    padding: '6px 11px',
                    fontSize: '0.82rem',
                    fontWeight: active ? '600' : '500',
                    color: active ? '#ffffff' : 'var(--text-secondary, #475569)',
                    backgroundColor: active ? '#4f46e5' : 'transparent',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 2px 6px rgba(79, 70, 229, 0.3)' : 'none',
                  }}
                >
                  <i
                    className={`bi ${item.icon}`}
                    style={{
                      fontSize: '0.85rem',
                      opacity: active ? 1 : 0.85,
                      color: active ? '#ffffff' : '#6366f1'
                    }}
                  ></i>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* 3. Right: Consolidated Controls (Theme + Notifications + Profile + Mobile Hamburger) */}
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            
            {/* Direct User Accounts Button (for ADMIN) */}
            {role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => setShowUsers(true)}
                className="btn btn-sm d-flex align-items-center gap-1.5 px-2.5 py-1 text-nowrap"
                style={{
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(79, 70, 229, 0.12)',
                  border: '1px solid rgba(79, 70, 229, 0.3)',
                  color: '#4f46e5',
                  fontWeight: '600',
                  fontSize: '0.8rem'
                }}
                title="Institutional User Accounts & Provisioning"
              >
                <i className="bi bi-people-fill"></i>
                <span className="d-none d-lg-inline">User Accounts</span>
              </button>
            )}

            {/* Quick Theme Toggle Icon */}
            <button
              type="button"
              onClick={handleThemeToggle}
              className="btn btn-sm d-flex align-items-center justify-content-center"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'var(--surface-elevated, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)',
                color: 'var(--text-secondary, #64748b)'
              }}
              title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
              aria-label="Toggle theme"
            >
              <i className={`bi ${theme === 'dark' ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill'}`} style={{ fontSize: '0.85rem' }}></i>
            </button>

            {/* Notifications Bell Dropdown */}
            <div className="position-relative" ref={notifMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  setShowProfileMenu(false);
                }}
                className="btn btn-sm d-flex align-items-center justify-content-center position-relative"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--surface-elevated, #f8fafc)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  color: 'var(--text-secondary, #64748b)'
                }}
                title="Institutional Notices & Alerts"
                aria-label="Notifications"
              >
                <i className="bi bi-bell-fill" style={{ fontSize: '0.85rem' }}></i>
                {unreadCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: '0.6rem', padding: '2px 5px' }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {showNotifMenu && (
                <div
                  className="position-absolute end-0 mt-2 shadow-lg border rounded-3 p-0 overflow-hidden"
                  style={{
                    width: '310px',
                    maxWidth: '90vw',
                    backgroundColor: 'var(--surface-card, #ffffff)',
                    borderColor: 'var(--border-color, #e2e8f0)',
                    zIndex: 1060
                  }}
                >
                  <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-body-tertiary">
                    <span className="small fw-bold" style={{ color: 'var(--text-primary)' }}>
                      <i className="bi bi-bell-fill text-warning me-1.5"></i> Notices & Alerts
                    </span>
                    {unreadCount > 0 && (
                      <button
                        className="btn btn-link btn-sm p-0 text-decoration-none small text-primary"
                        style={{ fontSize: '0.74rem' }}
                        onClick={markAllAsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '230px', overflowY: 'auto' }}>
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className="p-2.5 border-bottom small"
                        style={{
                          backgroundColor: n.unread ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
                          borderBottomColor: 'var(--border-color, #f1f5f9)'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold text-truncate" style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                            {n.title}
                          </span>
                          <span className="text-muted" style={{ fontSize: '0.68rem', flexShrink: 0, marginLeft: '6px' }}>{n.time}</span>
                        </div>
                        <p className="text-muted mb-0" style={{ fontSize: '0.72rem', lineHeight: '1.3' }}>
                          {n.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="position-relative" ref={profileMenuRef}>
              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-2 rounded-pill px-2.5 py-1"
                style={{
                  border: '1px solid var(--border-color, #e2e8f0)',
                  backgroundColor: 'var(--surface-elevated, #f8fafc)',
                  color: 'var(--text-primary)',
                  height: '34px'
                }}
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifMenu(false);
                }}
                aria-label="User account menu"
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: role === 'ADMIN' ? 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.7rem'
                  }}
                >
                  {getInitials(user?.name)}
                </div>

                <span className="d-none d-lg-inline small fw-semibold text-truncate" style={{ maxWidth: '100px', fontSize: '0.8rem' }}>
                  {role === 'ADMIN' ? 'Admin' : (user?.name ? user.name.split(' ')[0] : 'Account')}
                </span>

                <i className="bi bi-chevron-down text-muted" style={{ fontSize: '0.68rem' }}></i>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div
                  className="position-absolute end-0 mt-2 shadow-lg border rounded-3 p-0 overflow-hidden"
                  style={{
                    width: '240px',
                    maxWidth: '90vw',
                    backgroundColor: 'var(--surface-card, #ffffff)',
                    borderColor: 'var(--border-color, #e2e8f0)',
                    zIndex: 1060
                  }}
                >
                  {/* Account Header */}
                  <div className="p-3 border-bottom bg-body-tertiary">
                    <div className="fw-bold small text-truncate" style={{ color: 'var(--text-primary)' }}>
                      {role === 'ADMIN' ? 'System Administrator' : (user?.name || 'Institutional User')}
                    </div>
                    <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>
                      {user?.email || 'user@univ.edu'}
                    </div>
                    <div className="mt-1">
                      <span
                        className="badge rounded-pill"
                        style={{
                          fontSize: '0.65rem',
                          backgroundColor: roleBadgeStyle.bg,
                          color: roleBadgeStyle.color,
                          border: `1px solid ${roleBadgeStyle.border}`
                        }}
                      >
                        {role}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="py-1">
                    {role === 'ADMIN' && (
                      <button
                        className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 small"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowUsers(true);
                        }}
                      >
                        <i className="bi bi-people-fill text-primary" style={{ fontSize: '0.85rem' }}></i>
                        <span>User Management</span>
                      </button>
                    )}

                    <button
                      className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 small"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowPasswordModal(true);
                      }}
                    >
                      <i className="bi bi-key-fill text-warning" style={{ fontSize: '0.85rem' }}></i>
                      <span>Change Password</span>
                    </button>

                    <div className="dropdown-divider my-1"></div>

                    <button
                      className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 small text-danger"
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                    >
                      <i className="bi bi-box-arrow-right" style={{ fontSize: '0.85rem' }}></i>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger (Shown only < md) */}
            <button
              className="btn btn-sm btn-outline-secondary d-md-none d-flex align-items-center justify-content-center"
              style={{ width: '34px', height: '34px', borderRadius: '8px' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'} fs-6`}></i>
            </button>
          </div>
        </div>

        {/* 4. Mobile Menu Drawer (< md screens) */}
        {mobileMenuOpen && (
          <div
            className="d-md-none border-top px-3 py-2 shadow-lg w-100 position-absolute start-0 top-100"
            style={{
              backgroundColor: 'var(--surface-card, #ffffff)',
              borderColor: 'var(--border-color, #e2e8f0)',
              zIndex: 1050
            }}
          >
            <div className="d-flex flex-column gap-1 mb-2">
              {navLinks.map((item, idx) => {
                const active = isNavActive(item.path, item.tab);
                const destination = item.tab && item.path.includes('-portal') ? `${item.path}?tab=${item.tab}` : item.path;

                return (
                  <NavLink
                    key={idx}
                    to={destination}
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-sm d-flex align-items-center gap-2 rounded-2 px-3 py-2 fw-semibold text-start transition-all"
                    style={{
                      fontSize: '0.85rem',
                      backgroundColor: active ? '#4f46e5' : 'transparent',
                      color: active ? '#ffffff' : 'var(--text-secondary, #475569)',
                      border: active ? '1px solid #4f46e5' : '1px solid transparent'
                    }}
                  >
                    <i className={`bi ${item.icon} ${active ? 'text-white' : 'text-primary'}`}></i>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Modals */}
      {showUsers && <UserManagementModal onClose={() => setShowUsers(false)} />}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </>
  );
}

export default Navbar;
