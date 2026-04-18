import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReleases, createRelease, updateRelease, deleteRelease } from '../api/releases.js';
import { ToastContainer } from '../components/Toast.jsx';

const STATUS_META = {
  planning:    { label: 'Planning',    color: '#64748b', bg: '#f1f5f9' },
  in_progress: { label: 'In Progress', color: '#2563eb', bg: '#dbeafe' },
  released:    { label: 'Released',    color: '#059669', bg: '#d1fae5' },
  cancelled:   { label: 'Cancelled',   color: '#dc2626', bg: '#fee2e2' },
};

let toastSeq = 0;

function ProgressBar({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', minWidth: 80 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#059669' : '#2563eb', borderRadius: 999, transition: 'width .3s' }} />
      </div>
      <span style={{ fontSize: '.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>{pct}%</span>
    </div>
  );
}

function ReleaseFormModal({ release, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    version: release?.version || '',
    name: release?.name || '',
    description: release?.description || '',
    release_date: release?.release_date?.split('T')[0] || '',
    status: release?.status || 'planning',
  });
  const [errors, setErrors] = useState({});
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.version.trim()) { setErrors({ version: 'Version is required (e.g. 10.1.17)' }); return; }
    onSave({ ...form, version: form.version.trim(), name: form.name.trim() || null,
             description: form.description.trim() || null, release_date: form.release_date || null });
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{release ? 'Edit Release' : 'New Release'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Version * <span style={{fontWeight:400,color:'#64748b'}}>(e.g. 10.1.17)</span></label>
                <input className={`form-control ${errors.version ? 'error' : ''}`}
                  value={form.version} onChange={set('version')} placeholder="10.1.17" autoFocus />
                {errors.version && <p className="field-error">{errors.version}</p>}
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={form.status} onChange={set('status')}>
                  {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Name</label>
              <input className="form-control" value={form.name} onChange={set('name')} placeholder="e.g. Spring 2026 Release" />
            </div>
            <div className="form-group">
              <label>Release Date</label>
              <input type="date" className="form-control" value={form.release_date} onChange={set('release_date')} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={set('description')} placeholder="Release notes, goals…" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : release ? 'Update' : 'Create Release'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ReleasesPage() {
  const navigate = useNavigate();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [saving, setSaving]     = useState(false);
  const [toasts, setToasts]     = useState([]);

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: ++toastSeq, message: msg, type }]);
  const removeToast = id => setToasts(t => t.filter(x => x.id !== id));

  useEffect(() => { getReleases().then(setReleases).finally(() => setLoading(false)); }, []);

  const handleSave = async form => {
    setSaving(true);
    try {
      if (modal.release) {
        const updated = await updateRelease(modal.release.id, form);
        setReleases(rs => rs.map(r => r.id === updated.id ? { ...r, ...updated } : r));
        addToast('Release updated');
      } else {
        const created = await createRelease(form);
        setReleases(rs => [created, ...rs]);
        addToast('Release created');
      }
      setModal(null);
    } catch (err) { addToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteRelease(modal.release.id);
      setReleases(rs => rs.filter(r => r.id !== modal.release.id));
      addToast('Release deleted');
      setModal(null);
    } catch (err) { addToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Releases</h1>
          <p className="page-subtitle">Manage software release versions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'form', release: null })}>+ New Release</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Version</th><th>Name</th><th>Status</th><th>Release Date</th>
                <th>Epics</th><th>Tickets</th><th>Progress</th><th>Points</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="state-row"><td colSpan={9}>Loading releases…</td></tr>
              ) : releases.length === 0 ? (
                <tr className="state-row"><td colSpan={9}>No releases yet. Create your first one.</td></tr>
              ) : releases.map(r => {
                const sm = STATUS_META[r.status];
                return (
                  <tr key={r.id} className="clickable-row" onClick={() => navigate(`/releases/${r.id}`)}>
                    <td>
                      <span className="version-badge">{r.version}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.name || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td>
                      <span className="status-tag" style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                    </td>
                    <td style={{ fontSize: '.82rem', color: '#64748b' }}>
                      {r.release_date ? new Date(r.release_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </td>
                    <td><span className="count-chip">{r.epic_count}</span></td>
                    <td><span style={{ fontSize: '.82rem' }}>{r.done_count}/{r.ticket_count}</span></td>
                    <td style={{ minWidth: 140 }}><ProgressBar done={r.done_count} total={r.ticket_count} /></td>
                    <td style={{ fontSize: '.82rem' }}>{r.done_points}/{r.total_points} pts</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type: 'form', release: r })}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setModal({ type: 'delete', release: r })}>Delete</button>
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
        <ReleaseFormModal release={modal.release} onSave={handleSave} onClose={() => setModal(null)} saving={saving} />
      )}
      {modal?.type === 'delete' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header"><h3>Delete Release</h3><button className="modal-close" onClick={() => setModal(null)}>&times;</button></div>
            <div className="modal-body"><p>Delete release <strong>{modal.release.version}</strong>? All epics and tickets under it will be removed.</p></div>
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
