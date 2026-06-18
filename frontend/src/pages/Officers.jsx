import { useState, useEffect } from 'react';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Shield, User, X } from 'lucide-react';
import { format } from 'date-fns';

export default function Officers() {
  const { officer } = useAuth();
  const navigate = useNavigate();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'officer', department: '', badge_number: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (officer?.role !== 'super_admin') { navigate('/dashboard'); return; }
    authApi.getOfficers()
      .then(res => setOfficers(res.data.officers))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const res = await authApi.createOfficer(form);
      setOfficers(prev => [{ ...res.data.officer, is_active: true, created_at: new Date().toISOString() }, ...prev]);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'officer', department: '', badge_number: '' });
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create officer');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="loading-screen" style={{ background: 'transparent', minHeight: 300 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Officers</h1>
          <p>{officers.length} registered accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={14} /> Add Officer
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Badge</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {officers.map(o => (
              <tr key={o.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: o.role === 'super_admin' ? 'var(--purple-bg)' : 'var(--accent-glow)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                      color: o.role === 'super_admin' ? 'var(--purple)' : 'var(--accent)',
                      flexShrink: 0,
                    }}>
                      {o.name[0].toUpperCase()}
                    </div>
                    {o.name}
                  </div>
                </td>
                <td className="td-muted" style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{o.email}</td>
                <td>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'IBM Plex Mono',
                    background: o.role === 'super_admin' ? 'var(--purple-bg)' : 'var(--bg-3)',
                    color: o.role === 'super_admin' ? 'var(--purple)' : 'var(--text-2)',
                    border: `1px solid ${o.role === 'super_admin' ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`,
                  }}>
                    {o.role === 'super_admin' ? <Shield size={10} /> : <User size={10} />}
                    {o.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="td-muted">{o.department || '—'}</td>
                <td className="td-muted" style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{o.badge_number || '—'}</td>
                <td>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20, fontFamily: 'IBM Plex Mono',
                    background: o.is_active ? 'var(--green-bg)' : 'var(--red-bg)',
                    color: o.is_active ? 'var(--green)' : 'var(--red)',
                  }}>
                    {o.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="td-muted">{format(new Date(o.created_at), 'dd MMM yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Officer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div className="modal-title">Add New Officer</div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
                onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="login-error" style={{ marginBottom: 14 }}>{formError}</div>
            )}

            <form className="modal-form" onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password * (min 8 chars)</label>
                <input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="officer">Officer</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Badge Number</label>
                  <input className="input" value={form.badge_number} onChange={e => setForm(f => ({ ...f, badge_number: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="input" placeholder="e.g. Cyber Cell, Traffic, General" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
