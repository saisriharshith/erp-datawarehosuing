import React, { useState } from 'react';
import { useAuth, DEMO_PRESETS } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@univ.edu');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (user.role === 'STUDENT') navigate('/student-portal');
      else if (user.role === 'FACULTY') navigate('/faculty-portal');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (selectedEmail) => {
    if (!selectedEmail) return;
    setEmail(selectedEmail);
    setPassword('demo1234');
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="container" style={{ maxWidth: '500px' }}>
        <div className="text-center mb-4">
          <div className="display-5 text-primary mb-2"><i className="bi bi-mortarboard-fill"></i></div>
          <h3 className="fw-bold">UnivAnalytics MERN</h3>
          <p className="text-muted small">Institutional ERP Data Warehouse & Decision Support System</p>
        </div>

        <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          {/* 20 Account Quick Picker */}
          <div className="mb-4">
            <label className="form-label small fw-bold text-muted text-uppercase">1-Click Demo Account Picker (20 Profiles)</label>
            <select className="form-select form-select-sm" onChange={(e) => handleQuickSelect(e.target.value)} defaultValue="">
              <option value="">-- Choose Account (Admin / Faculty / Student) --</option>
              <optgroup label="👔 Institutional Leadership & Deans (2)">
                {DEMO_PRESETS.filter(p => p.role === 'ADMIN').map(p => (
                  <option key={p.email} value={p.email}>{p.name}</option>
                ))}
              </optgroup>
              <optgroup label="👨‍🏫 Department Faculty & HODs (8)">
                {DEMO_PRESETS.filter(p => p.role === 'FACULTY').map(p => (
                  <option key={p.email} value={p.email}>{p.name} ({p.badge})</option>
                ))}
              </optgroup>
              <optgroup label="🎓 Students Across 5 Departments (10)">
                {DEMO_PRESETS.filter(p => p.role === 'STUDENT').map(p => (
                  <option key={p.email} value={p.email}>{p.name} - {p.dept} ({p.badge})</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="position-relative my-3 text-center">
            <hr className="text-muted" />
            <span className="position-absolute top-50 start-50 translate-middle bg-white px-2 small text-muted">OR CREDENTIALS</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Institutional Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>Default password for all accounts: <code>demo1234</code></span>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold"
              disabled={loading}
              style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Authenticating...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
