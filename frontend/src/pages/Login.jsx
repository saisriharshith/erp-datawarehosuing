import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Login() {
  const { login, isAuth, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(true);

  // If already authenticated, redirect to appropriate role portal
  useEffect(() => {
    if (isAuth && user) {
      const role = user.role;
      if (role === 'STUDENT') navigate('/student-portal', { replace: true });
      else if (role === 'FACULTY') navigate('/faculty-portal', { replace: true });
      else if (role === 'ACCOUNTS') navigate('/accounts', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [isAuth, user, navigate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your institutional email / ID and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setError(result.message || 'Invalid institutional credentials. Please try again.');
        if (addToast) addToast(result.message || 'Authentication failed', 'danger');
      } else {
        if (addToast) addToast(`Welcome back, ${result.user?.name || 'User'}!`, 'success');
        const role = result.user?.role || result.role;
        if (role === 'STUDENT') navigate('/student-portal');
        else if (role === 'FACULTY') navigate('/faculty-portal');
        else if (role === 'ACCOUNTS') navigate('/accounts');
        else navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
      if (addToast) addToast('Sign in failed. Please try again.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#090d16',
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.18) 0, transparent 50%),
          radial-gradient(at 100% 0%, rgba(14, 165, 233, 0.15) 0, transparent 45%),
          radial-gradient(at 50% 100%, rgba(79, 70, 229, 0.12) 0, transparent 60%)
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%' }}>
        {/* Main Production Glassmorphic Card */}
        <div
          className="glass-surface-heavy"
          style={{
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.12)',
            padding: '40px 36px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Ambient Light Orb */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />

          {/* Institution Crest & Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px', position: 'relative' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                color: '#ffffff',
                borderRadius: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.95rem',
                marginBottom: '16px',
                boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
              }}
            >
              <i className="bi bi-mortarboard-fill"></i>
            </div>
            <h1
              style={{
                fontSize: '1.55rem',
                fontWeight: '800',
                color: 'var(--text-primary, #ffffff)',
                margin: '0 0 6px 0',
                letterSpacing: '-0.025em'
              }}
            >
              UnivAnalytics ERP
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary, #94a3b8)',
                margin: 0,
                letterSpacing: '-0.01em'
              }}
            >
              Institutional Single Sign-On & Portal Access
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '20px',
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              role="alert"
            >
              <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444' }}></i>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Input
              label="Institutional Email / Student ID"
              type="text"
              placeholder="e.g. admin@univ.edu or STU20220001"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<i className="bi bi-person-fill text-muted"></i>}
              required
              autoComplete="username"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter institutional password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<i className="bi bi-lock-fill text-muted"></i>}
              required
              autoComplete="current-password"
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '12px 0 20px 0',
                fontSize: '0.825rem'
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#6366f1', borderRadius: '4px' }}
                />
                <span>Remember this device</span>
              </label>
              <a
                href="mailto:it-support@univ.edu?subject=Institutional%20Password%20Reset%20Request"
                style={{
                  color: '#818cf8',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.975rem'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </Button>
          </form>

          {/* Security Footer */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '18px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center',
              fontSize: '0.78rem',
              color: 'var(--text-muted, #64748b)'
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <i className="bi bi-shield-check text-success"></i>
              <span>Enterprise Role-Based Access Control</span>
            </div>
            <div>
              New faculty or student? Contact your Dean's Office or Department Admin.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}