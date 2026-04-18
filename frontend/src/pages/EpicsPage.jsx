import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEpics, createEpic, updateEpic, deleteEpic } from '../api/epics.js';
import { getReleases } from '../api/releases.js';
import { ToastContainer } from '../components/Toast.jsx';

const EPIC_STATUS_META = {
  backlog:     { label: 'Backlog',     color: '#64748b', bg: '#f1f5f9' },
  in_progress: { label: 'In Progress', color: '#2563eb', bg: '#dbeafe' },
  done:        { label: 'Done',        color: '#059669', bg: '#d1fae5' },
  cancelled:   { label: 'Cancelled',   color: '#dc2626', bg: '#fee2e2' },
};

let toastSeq = 0;

function EpicFormModal({ epic, releases, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    title: epic?.title || '', description: epic?.description || '',
    status: epic?.status || 'backlog', release_id: epic?.release_id || '',
  });
  const [err, setErr] = useState('');
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const handleSubmit = e => {
    e.preventDefault();
    if (!form.title.trim()) { setErr('Title is required'); return; }
    onSave({ title: form.title.trim(), description: form.description.trim() || null,
             status: form.status, release_id: form.release_id || null });
  };
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>{epic ? 'Edit Epic' : 'New Epic'}</h3><button className="modal-close" onClick={onClose}>&times;</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Title *</label>
              <input className={`form-control ${err ? 'error' : ''}`} value={form.title}
                onChange={e => { set('title')(e); setErr(''); }} placeholder="Epic title" autoFocus />
              {err && <p className="field-error">{err}</p>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={form.status} onChange={set('status')}>
                  {Object.entries(EPIC_STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Release</label>
                <select className="form-control" value={form.release_id} onChange={set('release_id')}>
                  <option value="">No release</option>
                  {releases.map(r => <option key={r.id} value={r.id}>{r.version}{r.name ? ` — ${r.name}` : ''}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={set('description')} placeholder="Scope and goals…" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : epic ? 'Update' : 'Create Epic'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EpicsPage() {
  const navigate = useNavigate();
  const [epics, setEpics]       = useState([]);
  const [releases, setReleases] = useState([]);
  const [filter, setFilter]     = useState('');
  const [statusFilter, setStatus] = useState('');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [saving, setSaving]     = useState(false);
  const [toasts, setToasts]     = useState([]);

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: ++toastSeq, message: msg, type }]);
  const removeToast = id => setToasts(t => t.filter(x => x.id !== id));

  useEffect(() => {
    Promise.all([getEpics(), getReleases()]).then(([e, r]) => { setEpics(e); setReleases(r); }).finally(() => setLoading(false));
  }, []);

  const filtered = epics.filter(e =>
    (!filter || e.release_id === filter) &&
    (!statusFilter || e.status === statusFilter)
  );

  const handleSave = async form => {
    setSaving(true);
    try {
      if (modal.epic) {
        const updated = await updateEpic(modal.epic.id, form);
        setEpics(es => es.map(e => e.id === updated.id ? { ...e, ...updated } : e));
        addToast('Epic updated');
      } else {
        const created = await createEpic(form);
        setEpics(es => [created, ...es]);
        addToast('Epic created');
      }
      setModal(null);
    } catch (err) { addToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteEpic(modal.epic.id);
      setEpics(es => es.filter(e => e.id !== modal.epic.id));
      addToast('Epic deleted'); setModal(null);
    } catch (err) { addToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="page-header">
        <div><h1 className="page-title">Epics</h1><p className="page-subtitle">Projects and feature sets across releases</p></div>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'form', epic: null })}>+ New Epic</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>All Epics ({filtered.length})</h2>
          <div className="toolbar">
            <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Releases</option>
              {releases.map(r => <option key={r.id} value={r.id}>{r.version}{r.name ? ` — ${r.name}` : ''}</option>)}
            </select>
            <select className="filter-select" value={statusFilter} onChange={e => setStatus(e.target.value)}>
              <option value="">All Status</option>
              {Object.entries(EPIC_STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Title</th><th>Release</th><th>Status</th><th>Tickets</th><th>Progress</th><th>Points</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="state-row"><td colSpan={7}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr className="state-row"><td colSpan={7}>No epics found.</td></tr>
              ) : filtered.map(e => {
                const esm = EPIC_STATUS_META[e.status];
                const pct = e.ticket_count > 0 ? Math.round((e.done_count / e.ticket_count) * 100) : 0;
                return (
                  <tr key={e.id} className="clickable-row" onClick={() => navigate(`/epics/${e.id}`)}>
                    <td style={{ fontWeight: 500 }}>{e.title}</td>
                    <td>
                      {e.release_version
                        ? <span className="version-badge" style={{ fontSize: '.72rem' }}>{e.release_version}</span>
                        : <span style={{ color: '#94a3b8', fontSize: '.82rem' }}>—</span>}
                    </td>
                    <td><span className="status-tag" style={{ background: esm.bg, color: esm.color }}>{esm.label}</span></td>
                    <td style={{ fontSize: '.82rem' }}>{e.done_count}/{e.ticket_count}</td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
                        <div style={{ flex:1, height:5, background:'#e2e8f0', borderRadius:999, overflow:'hidden', minWidth:60 }}>
                          <div style={{ width:`${pct}%`, height:'100%', background: pct===100?'#059669':'#3b82f6', borderRadius:999 }} />
                        </div>
                        <span style={{ fontSize:'.72rem', color:'#64748b' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '.82rem' }}>{e.done_points}/{e.total_points} pts</td>
                    <td onClick={ev => ev.stopPropagation()}>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type:'form', epic:e })}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setModal({ type:'delete', epic:e })}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal?.type === 'form' && (
        <EpicFormModal epic={modal.epic} releases={releases} onSave={handleSave} onClose={() => setModal(null)} saving={saving} />
      )}
      {modal?.type === 'delete' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header"><h3>Delete Epic</h3><button className="modal-close" onClick={() => setModal(null)}>&times;</button></div>
            <div className="modal-body"><p>Delete <strong>{modal.epic.title}</strong>? All tickets will be permanently removed.</p></div>
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
