import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Loader, Shield } from 'lucide-react';

export default function Login() {
  const { officer, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ THE FIX: navigate only AFTER React has committed the officer state update.
  // Doing navigate() directly after login() would race against setOfficer().
  const from = location.state?.from?.pathname || '/dashboard';
  useEffect(() => {
    if (officer) navigate(from, { replace: true });
  }, [officer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      // Don't navigate here — the useEffect above handles it once officer state commits
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-emblem">🚔</div>
          <div className="login-title">KSP Admin Portal</div>
          <div className="login-sub">Karnataka State Police — Complaint Management</div>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="input"
              placeholder="officer@police.gov.in"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading
              ? <><Loader size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Signing in…</>
              : <><Shield size={14} /> Sign In</>}
          </button>
        </form>

        <div className="login-hint">
          Default credentials: <code>admin@police.gov.in</code> / <code>Admin@1234</code>
          <span style={{ color: '#ef4444', display: 'block', marginTop: 6 }}>
            ⚠ Change the default password after first login
          </span>
        </div>
      </div>
    </div>
  );
}
