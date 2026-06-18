import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintsApi } from '../api/client';
import { StatusBadge, CategoryBadge } from '../components/Badges';
import { Search, RefreshCw, Filter } from 'lucide-react';
import { format } from 'date-fns';

const STATUSES = ['', 'pending', 'in_progress', 'resolved', 'rejected'];
const STATUS_LABELS = { '': 'All Statuses', pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved', rejected: 'Rejected' };
const CATEGORIES = ['', 'theft', 'harassment', 'missing_person', 'traffic_incident', 'noise_disturbance', 'cyber_crime', 'other'];
const CAT_LABELS = { '': 'All Categories', theft: 'Theft', harassment: 'Harassment', missing_person: 'Missing Person', traffic_incident: 'Traffic', noise_disturbance: 'Noise/Disturb.', cyber_crime: 'Cyber Crime', other: 'Other' };

export default function Complaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', category: '', from: '', to: '', search: '' });
  const [page, setPage] = useState(1);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await complaintsApi.list(params);
      setComplaints(res.data.complaints);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);
  useEffect(() => { setPage(1); }, [filters]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Complaints</h1>
          <p>{pagination.total.toLocaleString()} total complaints</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchComplaints} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          {/* Search */}
          <div className="input-icon">
            <Search />
            <input
              className="input" placeholder="Search ID, name, description..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              style={{ width: 220 }}
            />
          </div>

          {/* Status filter */}
          <select className="input" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>

          {/* Category filter */}
          <select className="input" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>

          {/* Date range */}
          <input type="date" className="input" value={filters.from} onChange={e => setFilter('from', e.target.value)} />
          <input type="date" className="input" value={filters.to} onChange={e => setFilter('to', e.target.value)} />

          {(filters.status || filters.category || filters.from || filters.to || filters.search) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', category: '', from: '', to: '', search: '' })}>
              Clear
            </button>
          )}

          <div className="table-spacer" />
          <div className="table-count">{pagination.total} results</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th>Category</th>
              <th>Complainant</th>
              <th>Phone</th>
              <th>Location</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Filed</th>
            </tr>
          </thead>
          <tbody>
            {loading && complaints.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><div className="spinner" /></div></td></tr>
            ) : complaints.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <Filter />
                    <h3>No complaints found</h3>
                    <p>Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            ) : complaints.map(c => (
              <tr key={c.id} className="row-link" onClick={() => navigate(`/complaints/${c.id}`)}>
                <td className="td-id">{c.complaint_id}</td>
                <td><CategoryBadge category={c.category} /></td>
                <td>{c.complainant_name || <span className="td-muted">—</span>}</td>
                <td className="td-muted" style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
                  {c.complainant_phone}
                </td>
                <td className="td-muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.location_text || '—'}
                </td>
                <td><StatusBadge status={c.status} /></td>
                <td className="td-muted">{c.assigned_officer_name || <span style={{ color: 'var(--text-3)' }}>Unassigned</span>}</td>
                <td className="td-muted">{format(new Date(c.created_at), 'dd MMM yyyy, HH:mm')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Page {pagination.page} of {pagination.pages} · {pagination.total} records
            </div>
            <div className="pagination-btns">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(1)}>«</button>
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, pagination.pages - 4));
                const p = start + i;
                return (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                );
              })}
              <button className="page-btn" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>›</button>
              <button className="page-btn" disabled={page >= pagination.pages} onClick={() => setPage(pagination.pages)}>»</button>
            </div>
          </div>
        )}
      </div>

      <style>{`.spin { animation: spin 0.7s linear infinite; }`}</style>
    </div>
  );
}
