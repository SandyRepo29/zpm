import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRelease } from '../api/releases.js';
import { createEpic, updateEpic, deleteEpic } from '../api/epics.js';
import { ToastContainer } from '../components/Toast.jsx';

const RELEASE_STATUS = { planning:'Planning', in_progress:'In Progress', released:'Released', cancelled:'Cancelled' };
const EPIC_STATUS_META = {
  backlog:     { label: 'Backlog',     color: '#64748b', bg: '#f1f5f9' },
  in_progress: { label: 'In Progress', color: '#2563eb', bg: '#dbeafe' },
  done:        { label: 'Done',        color: '#059669', bg: '#d1fae5' },
  cancelled:   { label: 'Cancelled',   color: '#dc2626', bg: '#fee2e2' },
};

let toastSeq = 0;

function EpicFormModal({ epic, releaseId, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    title: epic?.title || '', description: epic?.description || '', status: epic?.status || 'backlog',
  });
  const [err, setErr] = useState('');
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const handleSubmit = e => {
    e.preventDefault();
    if (!form.title.trim()) { setErr('Title is required'); return; }
    onSave({ title: form.title.trim(), description: form.description.trim() || null,
             status: form.status, release_id: releaseId });
  };
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{epic ? 'Edit Epic' : 'Add Epic'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Title *</label>
              <input className={`form-control ${err ? 'error' : ''}`} value={form.title}
                onChange={e => { set('title')(e); setErr(''); }} placeholder="e.g. Auth Refactor" autoFocus />
              {err && <p className="field-error">{err}</p>}
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={form.status} onChange={set('status')}>
                {Object.entries(EPIC_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={3} value={form.description}
                onChange={set('description')} placeholder="Epic scope and goals…" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : epic ? 'Update' : 'Add Epic'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ReleaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [saving, setSaving]   = useState(false);
  const [toasts, setToasts]   = useState([]);

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: ++toastSeq, message: msg, type }]);
  const removeToast = id => setToasts(t => t.filter(x => x.id !== id));

  const reload = () => getRelease(id).then(setRelease).finally(() => setLoading(false));
  useEffect(() => { reload(); }, [id]);

  const handleSave = async form => {
    setSaving(true);
    try {
      if (modal.epic) {
        const updated = await updateEpic(modal.epic.id, form);
        setRelease(r => ({ ...r, epics: r.epics.map(e => e.id === updated.id ? { ...e, ...updated } : e) }));
        addToast('Epic updated');
      } else {
        await createEpic(form);
        await reload();
        addToast('Epic added');
      }
      setModal(null);
    } catch (err) { addToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteEpic(modal.epic.id);
      setRelease(r => ({ ...r, epics: r.epics.filter(e => e.id !== modal.epic.id) }));
      addToast('Epic deleted');
      setModal(null);
    } catch (err) { addToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <p style={{ color: '#64748b', padding: 32 }}>Loading…</p>;
  if (!release) return <p style={{ color: '#dc2626', padding: 32 }}>Release not found.</p>;

  const totalTickets = release.epics.reduce((s, e) => s + (e.ticket_count || 0), 0);
  const doneTickets  = release.epics.reduce((s, e) => s + (e.done_count  || 0), 0);
  const totalPoints  = release.epics.reduce((s, e) => s + (e.total_points || 0), 0);
  const donePoints   = release.epics.reduce((s, e) => s + (e.done_points  || 0), 0);
  const pct = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;
  const sm = { planning:'#64748b', in_progress:'#2563eb', released:'#059669', cancelled:'#dc2626' };

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/releases')}>Releases</button>
        <span className="breadcrumb-sep">/</span>
        <span>{release.version}</span>
      </div>

      {/* Release header */}
      <div className="release-header">
        <div className="release-header-left">
          <div className="release-version-large">{release.version}</div>
          <div>
            <h1 className="page-title">{release.name || release.version}</h1>
            {release.description && <p className="page-subtitle">{release.description}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <span className="status-tag" style={{ background: sm[release.status] + '22', color: sm[release.status] }}>
                {RELEASE_STATUS[release.status]}
              </span>
              {release.release_date && (
                <span style={{ fontSize: '.82rem', color: '#64748b' }}>
                  📅 {new Date(release.release_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/releases')}>← Back</button>
      </div>

      {/* Stats strip */}
      <div className="release-stats">
        <div className="rstat"><div className="rstat-val">{release.epics.length}</div><div className="rstat-label">Epics</div></div>
        <div className="rstat"><div className="rstat-val">{totalTickets}</div><div className="rstat-label">Tickets</div></div>
        <div className="rstat"><div className="rstat-val">{doneTickets}</div><div className="rstat-label">Done</div></div>
        <div className="rstat"><div className="rstat-val">{totalPoints}</div><div className="rstat-label">Total Points</div></div>
        <div className="rstat"><div className="rstat-val">{donePoints}</div><div className="rstat-label">Done Points</div></div>
        <div className="rstat rstat-progress">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '.78rem', color: '#64748b' }}>Overall Progress</span>
            <span style={{ fontSize: '.78rem', fontWeight: 700 }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct===100?'#059669':'#2563eb', borderRadius: 999 }} />
          </div>
        </div>
      </div>

      {/* Epics section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 0 12px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Epics ({release.epics.length})</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: 'form', epic: null })}>+ Add Epic</button>
      </div>

      {release.epics.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          No epics yet. Add the first epic to this release.
        </div>
      ) : (
        <div className="epics-grid">
          {release.epics.map(e => {
            const esm = EPIC_STATUS_META[e.status];
            const epct = e.ticket_count > 0 ? Math.round((e.done_count / e.ticket_count) * 100) : 0;
            return (
              <div key={e.id} className="epic-card" onClick={() => navigate(`/epics/${e.id}`)}>
                <div className="epic-card-top">
                  <span className="status-tag" style={{ background: esm.bg, color: esm.color }}>{esm.label}</span>
                  <div className="epic-card-actions" onClick={ev => ev.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type: 'form', epic: e })}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setModal({ type: 'delete', epic: e })}>Delete</button>
                  </div>
                </div>
                <h3 className="epic-card-title">{e.title}</h3>
                {e.description && <p className="epic-card-desc">{e.description}</p>}
                <div className="epic-card-stats">
                  <span>{e.ticket_count} tickets</span>
                  <span>{e.total_points} pts</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '.72rem', color: '#94a3b8' }}>{e.done_count}/{e.ticket_count} done</span>
                    <span style={{ fontSize: '.72rem', fontWeight: 700 }}>{epct}%</span>
                  </div>
                  <div style={{ height: 5, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${epct}%`, height: '100%', background: epct===100?'#059669':'#3b82f6', borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal?.type === 'form' && (
        <EpicFormModal epic={modal.epic} releaseId={id} onSave={handleSave} onClose={() => setModal(null)} saving={saving} />
      )}
      {modal?.type === 'delete' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header"><h3>Delete Epic</h3><button className="modal-close" onClick={() => setModal(null)}>&times;</button></div>
            <div className="modal-body"><p>Delete epic <strong>{modal.epic.title}</strong>? All tickets will be removed.</p></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
