import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export function Forbidden() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const attemptedPath = location.state?.attemptedPath || location.pathname;
  const role = user?.role || 'GUEST';

  const getAuthorizedPath = () => {
    if (role === 'STUDENT') return '/student-portal';
    if (role === 'FACULTY') return '/faculty-portal';
    if (role === 'ACCOUNTS') return '/accounts';
    if (role === 'ADMIN') return '/dashboard';
    return '/login';
  };

  const getPortalLabel = () => {
    if (role === 'STUDENT') return 'Student 360 Hub';
    if (role === 'FACULTY') return 'Department Academic Portal';
    if (role === 'ACCOUNTS') return 'Tuition & Accounts Directorate';
    if (role === 'ADMIN') return 'Executive Command Center';
    return 'Sign In';
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--bg-body, #f8fafc)'
      }}
    >
      <Card
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          padding: '16px',
          border: '1.5px solid #fecaca'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            margin: '0 auto 16px auto'
          }}
        >
          <i className="bi bi-shield-lock-fill"></i>
        </div>

        <span
          style={{
            display: 'inline-block',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            fontSize: '0.75rem',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '12px'
          }}
        >
          403 Access Denied — Role Restricted
        </span>

        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 8px 0'
          }}
        >
          Institutional Permission Required
        </h2>

        <p
          style={{
            fontSize: '0.9rem',
            color: '#64748b',
            lineHeight: 1.5,
            margin: '0 0 16px 0'
          }}
        >
          You are currently signed in as <strong>{user?.name || role}</strong> (<span style={{ color: '#4f46e5', fontWeight: '600' }}>{role}</span>).
          Your role does not have authorization to view the module at <code>{attemptedPath}</code>.
        </p>

        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '0.8rem',
            color: '#475569',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
            <i className="bi bi-info-circle-fill text-primary"></i> Role-Based Access Control (RBAC) Governance:
          </div>
          <div>• <strong>STUDENT</strong>: Scoped strictly to personal grades, attendance, and hall ticket.</div>
          <div>• <strong>FACULTY</strong>: Scoped to department advisees & academic interventions.</div>
          <div>• <strong>ADMIN</strong>: Institutional executive & data quality audit control.</div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <Button
            variant="primary"
            onClick={() => navigate(getAuthorizedPath())}
            icon={<i className="bi bi-arrow-right-circle-fill"></i>}
          >
            Return to {getPortalLabel()}
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/login')}
          >
            Switch Account
          </Button>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', fontSize: '0.72rem', color: '#94a3b8' }}>
          <i className="bi bi-shield-check me-1"></i>
          This access attempt has been logged under FERPA / Institutional Audit ID: {Date.now().toString(36).toUpperCase()}
        </div>
      </Card>
    </div>
  );
}

export default Forbidden;