import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../api/client';
import { StatusBadge, CategoryBadge } from '../components/Badges';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { ClipboardList, Clock, CheckCircle, XCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STAT_COLORS = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#10b981',
  rejected: '#ef4444',
};

const PIE_COLORS = ['#3b82f6','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1a1d24', border: '1px solid #2a2e38',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: '#9aa0b0', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#e8eaf0', fontFamily: 'IBM Plex Mono' }}>
          {p.value}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      complaintsApi.stats(),
      complaintsApi.list({ limit: 6, page: 1 }),
    ]).then(([statsRes, listRes]) => {
      setStats(statsRes.data);
      setRecentComplaints(listRes.data.complaints);
    }).finally(() => setLoading(false));

    // Poll every 30 seconds
    const interval = setInterval(() => {
      complaintsApi.stats().then(r => setStats(r.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="loading-screen" style={{ background: 'transparent', minHeight: 300 }}>
      <div className="spinner" />
    </div>
  );

  const { stats: s = {}, byCategory = [], lastWeek = [] } = stats || {};

  const weekData = lastWeek.map(r => ({
    date: format(parseISO(r.date), 'MMM d'),
    count: parseInt(r.count),
  }));

  const categoryPieData = byCategory.map(r => ({
    name: r.category.replace('_', ' '),
    value: parseInt(r.count),
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of all complaints and activity</p>
        </div>
        <Link to="/complaints" className="btn btn-primary">
          View All Complaints <ArrowRight size={14} />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon={<ClipboardList />} label="Total Complaints" value={s.total || 0}
          color="var(--accent)" glow="var(--accent)"
        />
        <StatCard
          icon={<Clock />} label="Pending" value={s.pending || 0}
          color="var(--yellow)" glow="var(--yellow)"
        />
        <StatCard
          icon={<TrendingUp />} label="In Progress" value={s.in_progress || 0}
          color="var(--blue)" glow="var(--blue)"
        />
        <StatCard
          icon={<CheckCircle />} label="Resolved" value={s.resolved || 0}
          color="var(--green)" glow="var(--green)"
        />
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Activity — Last 7 Days</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2e38" />
              <XAxis dataKey="date" tick={{ fill: '#5a6070', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6070', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">By Category</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                   dataKey="value" paddingAngle={3}>
                {categoryPieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 8 }}>
            {categoryPieData.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span style={{ color: '#9aa0b0', textTransform: 'capitalize' }}>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-title">Recent Complaints</div>
          <div className="table-spacer" />
          <Link to="/complaints" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Complainant</th>
              <th>Location</th>
              <th>Status</th>
              <th>Filed</th>
            </tr>
          </thead>
          <tbody>
            {recentComplaints.map(c => (
              <tr key={c.id} className="row-link" onClick={() => window.location.href = `/complaints/${c.id}`}>
                <td className="td-id">{c.complaint_id}</td>
                <td><CategoryBadge category={c.category} /></td>
                <td>{c.complainant_name || <span className="td-muted">Anonymous</span>}</td>
                <td className="td-muted" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.location_text || '—'}
                </td>
                <td><StatusBadge status={c.status} /></td>
                <td className="td-muted">{format(new Date(c.created_at), 'dd MMM, HH:mm')}</td>
              </tr>
            ))}
            {recentComplaints.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No complaints yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, glow }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: `${color}20` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="stat-card-value" style={{ color }}>{value.toLocaleString()}</div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-glow" style={{ background: glow }} />
    </div>
  );
}
