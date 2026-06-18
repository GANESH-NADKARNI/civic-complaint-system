import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintsApi, authApi } from '../api/client';
import { StatusBadge, CategoryBadge } from '../components/Badges';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { ArrowLeft, Send, MapPin, Phone, User, Clock, Paperclip, AlertTriangle } from 'lucide-react';

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { officer } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [notes, setNotes] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    Promise.all([
      complaintsApi.get(id),
      officer?.role === 'super_admin' ? authApi.getOfficers() : Promise.resolve({ data: { officers: [] } }),
    ]).then(([compRes, offRes]) => {
      setComplaint(compRes.data.complaint);
      setNotes(compRes.data.notes);
      setOfficers(offRes.data.officers || []);
      setSelectedOfficer(compRes.data.complaint.assigned_officer_id || '');
    }).catch(() => navigate('/complaints'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status, rejection_reason = null) => {
    setActionLoading(true);
    try {
      const res = await complaintsApi.updateStatus(id, status, rejection_reason);
      setComplaint(c => ({ ...c, status: res.data.complaint.status, rejection_reason }));
      setShowRejectInput(false);
      setRejectReason('');
    } finally {
      setActionLoading(false);
    }
  };

  const assignOfficer = async () => {
    if (!selectedOfficer) return;
    setActionLoading(true);
    try {
      await complaintsApi.assign(id, parseInt(selectedOfficer));
      const off = officers.find(o => o.id === parseInt(selectedOfficer));
      setComplaint(c => ({ ...c, assigned_officer_id: parseInt(selectedOfficer), assigned_officer_name: off?.name }));
    } finally {
      setActionLoading(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setNoteLoading(true);
    try {
      const res = await complaintsApi.addNote(id, noteText);
      setNotes(n => [res.data.note, ...n]);
      setNoteText('');
    } finally {
      setNoteLoading(false);
    }
  };

  if (loading) return <div className="loading-screen" style={{ background: 'transparent', minHeight: 300 }}><div className="spinner" /></div>;
  if (!complaint) return null;

  return (
    <div>
      <div onClick={() => navigate('/complaints')} className="back-link" style={{ cursor: 'pointer' }}>
        <ArrowLeft size={14} /> Back to Complaints
      </div>

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontFamily: 'IBM Plex Mono', fontSize: 20 }}>{complaint.complaint_id}</h1>
            <StatusBadge status={complaint.status} />
            <CategoryBadge category={complaint.category} />
          </div>
          <p>Filed {format(new Date(complaint.created_at), 'dd MMMM yyyy, HH:mm')}</p>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left: Details + Notes */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="detail-section">
              <div className="detail-section-title">Complainant Information</div>
              <div className="detail-field">
                <span className="detail-field-label"><User size={12} style={{ display: 'inline', marginRight: 4 }} />Name</span>
                <span className="detail-field-value">{complaint.complainant_name || 'Not provided'}</span>
              </div>
              <div className="detail-field">
                <span className="detail-field-label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Phone</span>
                <span className="detail-field-value" style={{ fontFamily: 'IBM Plex Mono' }}>{complaint.complainant_phone}</span>
              </div>
              <div className="detail-field">
                <span className="detail-field-label"><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Location</span>
                <span className="detail-field-value">{complaint.location_text || 'Not provided'}</span>
              </div>
              {complaint.location_lat && (
                <div className="detail-field">
                  <span className="detail-field-label">GPS Coords</span>
                  <a
                    href={`https://www.google.com/maps?q=${complaint.location_lat},${complaint.location_lng}`}
                    target="_blank" rel="noreferrer"
                    style={{ color: 'var(--accent)', fontFamily: 'IBM Plex Mono', fontSize: 12 }}
                  >
                    {complaint.location_lat}, {complaint.location_lng} ↗
                  </a>
                </div>
              )}
              <div className="detail-field">
                <span className="detail-field-label"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Language</span>
                <span className="detail-field-value" style={{ textTransform: 'uppercase', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
                  {complaint.language}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Description</div>
              <div className="detail-description">{complaint.description}</div>
            </div>

            {complaint.rejection_reason && (
              <div className="detail-section">
                <div className="detail-section-title" style={{ color: 'var(--red)' }}>Rejection Reason</div>
                <div className="detail-description" style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--red)' }}>
                  {complaint.rejection_reason}
                </div>
              </div>
            )}

            {complaint.attachment_url && (
              <div className="detail-section">
                <div className="detail-section-title">Attachment</div>
                <div className="attachment-preview">
                  <img src={complaint.attachment_url} alt="Evidence" onError={e => e.target.style.display='none'} />
                </div>
                <a href={complaint.attachment_url} target="_blank" rel="noreferrer" className="attachment-link" style={{ marginTop: 8 }}>
                  <Paperclip size={14} /> View Full Attachment
                </a>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Internal Notes</div>
            </div>
            <div className="notes-list">
              {notes.length === 0 && (
                <div style={{ color: 'var(--text-3)', fontSize: 13, padding: '8px 0' }}>No notes yet.</div>
              )}
              {notes.map(n => (
                <div key={n.id} className="note-item">
                  <div className="note-header">
                    <span className="note-author">{n.officer_name}</span>
                    <span className="note-time">{format(new Date(n.created_at), 'dd MMM, HH:mm')}</span>
                  </div>
                  <div className="note-text">{n.note}</div>
                </div>
              ))}
            </div>
            <div className="note-input-area">
              <textarea
                placeholder="Add internal note visible only to officers..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') addNote(); }}
              />
              <button className="btn btn-primary" onClick={addNote} disabled={noteLoading || !noteText.trim()}
                style={{ alignSelf: 'flex-end' }}>
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Actions</div>
            </div>

            <div className="action-section">
              <div className="action-section-title">Update Status</div>
              <div className="action-btns">
                {complaint.status !== 'in_progress' && (
                  <button className="btn btn-ghost" disabled={actionLoading}
                    onClick={() => updateStatus('in_progress')} style={{ justifyContent: 'flex-start' }}>
                    🔵 Mark In Progress
                  </button>
                )}
                {complaint.status !== 'resolved' && (
                  <button className="btn btn-success" disabled={actionLoading}
                    onClick={() => updateStatus('resolved')} style={{ justifyContent: 'flex-start' }}>
                    ✅ Mark Resolved
                  </button>
                )}
                {complaint.status !== 'rejected' && !showRejectInput && (
                  <button className="btn btn-danger" disabled={actionLoading}
                    onClick={() => setShowRejectInput(true)} style={{ justifyContent: 'flex-start' }}>
                    ❌ Reject Complaint
                  </button>
                )}
                {showRejectInput && (
                  <div>
                    <textarea
                      placeholder="Reason for rejection (required)..."
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      style={{
                        width: '100%', minHeight: 80, background: 'var(--bg-3)',
                        border: '1px solid var(--border)', color: 'var(--text)',
                        borderRadius: 'var(--radius)', padding: '8px 10px', fontSize: 13,
                        fontFamily: 'IBM Plex Sans', marginBottom: 8, resize: 'vertical', outline: 'none',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-danger btn-sm" disabled={!rejectReason.trim() || actionLoading}
                        onClick={() => updateStatus('rejected', rejectReason)}>
                        Confirm Reject
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowRejectInput(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {complaint.status !== 'pending' && (
                  <button className="btn btn-ghost" disabled={actionLoading}
                    onClick={() => updateStatus('pending')} style={{ justifyContent: 'flex-start' }}>
                    🟡 Reset to Pending
                  </button>
                )}
              </div>
            </div>

            {officer?.role === 'super_admin' && (
              <div className="action-section">
                <div className="action-section-title">Assign Officer</div>
                <select className="select-input" value={selectedOfficer} onChange={e => setSelectedOfficer(e.target.value)}
                  style={{ marginBottom: 8 }}>
                  <option value="">— Select Officer —</option>
                  {officers.filter(o => o.role === 'officer').map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({o.department || 'General'})</option>
                  ))}
                </select>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                  disabled={!selectedOfficer || actionLoading} onClick={assignOfficer}>
                  Assign
                </button>
                {complaint.assigned_officer_name && (
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
                    Currently: <span style={{ color: 'var(--accent)' }}>{complaint.assigned_officer_name}</span>
                  </div>
                )}
              </div>
            )}

            <div className="action-section">
              <div className="action-section-title">Complaint Info</div>
              <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['ID', complaint.complaint_id],
                  ['Created', format(new Date(complaint.created_at), 'dd MMM yyyy')],
                  ['Updated', format(new Date(complaint.updated_at), 'dd MMM yyyy, HH:mm')],
                  ['Language', complaint.language?.toUpperCase()],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>{label}</span>
                    <span style={{ fontFamily: 'IBM Plex Mono', color: 'var(--text-2)' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
