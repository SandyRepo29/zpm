import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEpic, updateEpic } from '../api/epics.js';
import { createTicket, updateTicket, deleteTicket } from '../api/tickets.js';
import { getResources } from '../api/resources.js';
import { ToastContainer } from '../components/Toast.jsx';

const TICKET_STATUS_META = {
  backlog:     { label: 'Backlog',     color: '#64748b', bg: '#f1f5f9' },
  todo:        { label: 'Todo',        color: '#2563eb', bg: '#dbeafe' },
  in_progress: { label: 'In Progress', color: '#d97706', bg: '#fef3c7' },
  review:      { label: 'Review',      color: '#7c3aed', bg: '#ede9fe' },
  done:        { label: 'Done',        color: '#059669', bg: '#d1fae5' },
};
const TICKET_TYPE_META = {
  story:    { label: 'Story',    color: '#2563eb', bg: '#dbeafe', icon: '📖' },
  bug:      { label: 'Bug',      color: '#dc2626', bg: '#fee2e2', icon: '🐛' },
  task:     { label: 'Task',     color: '#64748b', bg: '#f1f5f9', icon: '✅' },
  sub_task: { label: 'Sub-task', color: '#7c3aed', bg: '#ede9fe', icon: '↳' },
};
const EPIC_STATUS_META = {
  backlog:'backlog', in_progress:'in_progress', done:'done', cancelled:'cancelled'
};
const SP_OPTIONS = [1, 2, 3, 5, 8, 13, 21];

let toastSeq = 0;

function TicketFormModal({ ticket, epicId, resources, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    title: ticket?.title || '', description: ticket?.description || '',
    type: ticket?.type || 'story', status: ticket?.status || 'backlog',
    resource_id: ticket?.resource_id || '',
    story_points: ticket?.story_points?.toString() || '',
    start_date: ticket?.start_date?.split('T')[0] || '',
    end_date:   ticket?.end_date?.split('T')[0] || '',
  });
  const [err, setErr] = useState('');
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.title.trim()) { setErr('Title is required'); return; }
    onSave({
      epic_id: epicId, title: form.title.trim(), description: form.description.trim() || null,
      type: form.type, status: form.status,
      resource_id:  form.resource_id  || null,
      story_points: form.story_points ? Number(form.story_points) : null,
      start_date:   form.start_date   || null,
      end_date:     form.end_date     || null,
    });
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <h3>{ticket ? `Edit ZPM-${ticket.ticket_no}` : 'New Ticket'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Title *</label>
              <input className={`form-control ${err ? 'error' : ''}`} value={form.title}
                onChange={e => { set('title')(e); setErr(''); }} placeholder="Ticket title" autoFocus />
              {err && <p className="field-error">{err}</p>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select className="form-control" value={form.type} onChange={set('type')}>
                  {Object.entries(TICKET_TYPE_META).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={form.status} onChange={set('status')}>
                  {Object.entries(TICKET_STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Assignee</label>
                <select className="form-control" value={form.resource_id} onChange={set('resource_id')}>
                  <option value="">Unassigned</option>
                  {resources.map(r => <option key={r.id} value={r.id}>{r.first_name} {r.last_name} [{r.department}]</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Story Points</label>
                <select className="form-control" value={form.story_points} onChange={set('story_points')}>
                  <option value="">—</option>
                  {SP_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" className="form-control" value={form.start_date} onChange={set('start_date')} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" className="form-control" value={form.end_date} onChange={set('end_date')} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={set('description')} placeholder="Details, acceptance criteria…" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : ticket ? 'Update' : 'Add Ticket'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EpicDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [epic, setEpic]         = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [saving, setSaving]     = useState(false);
  const [toasts, setToasts]     = useState([]);

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: ++toastSeq, message: msg, type }]);
  const removeToast = id => setToasts(t => t.filter(x => x.id !== id));

  const reload = () => getEpic(id).then(setEpic).finally(() => setLoading(false));
  useEffect(() => { Promise.all([getEpic(id), getResources()]).then(([e, r]) => { setEpic(e); setResources(r); }).finally(() => setLoading(false)); }, [id]);

  const handleSave = async form => {
    setSaving(true);
    try {
      if (modal.ticket) {
        const updated = await updateTicket(modal.ticket.id, form);
        setEpic(ep => ({ ...ep, tickets: ep.tickets.map(t => t.id === updated.id ? updated : t) }));
        addToast('Ticket updated');
      } else {
        const created = await createTicket(form);
        setEpic(ep => ({ ...ep, tickets: [...ep.tickets, created] }));
        addToast('Ticket added');
      }
      setModal(null);
    } catch (err) { addToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteTicket(modal.ticket.id);
      setEpic(ep => ({ ...ep, tickets: ep.tickets.filter(t => t.id !== modal.ticket.id) }));
      addToast('Ticket deleted'); setModal(null);
    } catch (err) { addToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  // Quick status change inline
  const handleStatusChange = async (ticket, newStatus) => {
    try {
      const updated = await updateTicket(ticket.id, { ...ticket, status: newStatus, resource_id: ticket.resource_id || null });
      setEpic(ep => ({ ...ep, tickets: ep.tickets.map(t => t.id === updated.id ? updated : t) }));
    } catch (err) { addToast(err.message, 'error'); }
  };

  if (loading) return <p style={{ color: '#64748b', padding: 32 }}>Loading…</p>;
  if (!epic)   return <p style={{ color: '#dc2626', padding: 32 }}>Epic not found.</p>;

  const totalPts = epic.tickets.reduce((s, t) => s + (t.story_points || 0), 0);
  const donePts  = epic.tickets.filter(t => t.status === 'done').reduce((s, t) => s + (t.story_points || 0), 0);
  const doneCount = epic.tickets.filter(t => t.status === 'done').length;
  const pct = epic.tickets.length > 0 ? Math.round((doneCount / epic.tickets.length) * 100) : 0;
  const esm = { backlog:'#64748b', in_progress:'#2563eb', done:'#059669', cancelled:'#dc2626' };

  return (
    <>
      <div className="breadcrumb">
        {epic.release_version && <>
          <button className="breadcrumb-link" onClick={() => navigate('/releases')}>Releases</button>
          <span className="breadcrumb-sep">/</span>
          <button className="breadcrumb-link" onClick={() => navigate(`/releases/${epic.release_id}`)}>{epic.release_version}</button>
          <span className="breadcrumb-sep">/</span>
        </>}
        {!epic.release_version && <>
          <button className="breadcrumb-link" onClick={() => navigate('/epics')}>Epics</button>
          <span className="breadcrumb-sep">/</span>
        </>}
        <span>{epic.title}</span>
      </div>

      <div className="release-header">
        <div className="release-header-left">
          <div className="epic-icon-large">E</div>
          <div>
            <h1 className="page-title">{epic.title}</h1>
            {epic.description && <p className="page-subtitle">{epic.description}</p>}
            <div style={{ display:'flex', gap:10, marginTop:8, alignItems:'center' }}>
              <span className="status-tag" style={{ background: esm[epic.status]+'22', color: esm[epic.status] }}>
                {epic.status.replace('_', ' ')}
              </span>
              {epic.release_version && <span className="version-badge" style={{ fontSize:'.72rem' }}>{epic.release_version}</span>}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate(epic.release_id ? `/releases/${epic.release_id}` : '/epics')}>← Back</button>
      </div>

      {/* Stats */}
      <div className="release-stats">
        <div className="rstat"><div className="rstat-val">{epic.tickets.length}</div><div className="rstat-label">Tickets</div></div>
        <div className="rstat"><div className="rstat-val">{doneCount}</div><div className="rstat-label">Done</div></div>
        <div className="rstat"><div className="rstat-val">{totalPts}</div><div className="rstat-label">Story Points</div></div>
        <div className="rstat"><div className="rstat-val">{donePts}</div><div className="rstat-label">Points Done</div></div>
        <div className="rstat rstat-progress">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontSize:'.78rem', color:'#64748b' }}>Progress</span>
            <span style={{ fontSize:'.78rem', fontWeight:700 }}>{pct}%</span>
          </div>
          <div style={{ height:8, background:'#e2e8f0', borderRadius:999, overflow:'hidden' }}>
            <div style={{ width:`${pct}%`, height:'100%', background: pct===100?'#059669':'#3b82f6', borderRadius:999 }} />
          </div>
        </div>
      </div>

      {/* Tickets table */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'24px 0 12px' }}>
        <h2 style={{ fontSize:'1rem', fontWeight:700 }}>Tickets ({epic.tickets.length})</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({ type:'form', ticket:null })}>+ Add Ticket</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th style={{width:90}}>ID</th><th>Title</th><th>Type</th><th>Status</th><th>Assignee</th><th>Points</th><th>Start</th><th>End</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {epic.tickets.length === 0 ? (
                <tr className="state-row"><td colSpan={9}>No tickets yet. Add the first one.</td></tr>
              ) : epic.tickets.map(t => {
                const tsm = TICKET_STATUS_META[t.status];
                const ttm = TICKET_TYPE_META[t.type];
                return (
                  <tr key={t.id}>
                    <td><span className="ticket-id">ZPM-{t.ticket_no}</span></td>
                    <td style={{ maxWidth:280 }}>
                      <span style={{ fontWeight:500, display:'block' }}>{t.title}</span>
                      {t.description && <span style={{ fontSize:'.75rem', color:'#94a3b8', display:'block', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.description}</span>}
                    </td>
                    <td><span className="type-tag" style={{ background:ttm.bg, color:ttm.color }}>{ttm.icon} {ttm.label}</span></td>
                    <td>
                      <select
                        className="status-select"
                        style={{ background:tsm.bg, color:tsm.color }}
                        value={t.status}
                        onChange={e => handleStatusChange(t, e.target.value)}
                      >
                        {Object.entries(TICKET_STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td>
                      {t.resource_id ? (
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div className="member-avatar" style={{ width:24, height:24, fontSize:'.6rem' }}>
                            {t.resource_first_name?.[0]}{t.resource_last_name?.[0]}
                          </div>
                          <span style={{ fontSize:'.82rem' }}>{t.resource_first_name} {t.resource_last_name}</span>
                          <span className={`badge badge-${t.resource_department}`} style={{ fontSize:'.62rem' }}>{t.resource_department}</span>
                        </div>
                      ) : <span style={{ color:'#94a3b8', fontSize:'.82rem' }}>Unassigned</span>}
                    </td>
                    <td>
                      {t.story_points ? (
                        <span className="sp-chip">{t.story_points}</span>
                      ) : <span style={{ color:'#94a3b8' }}>—</span>}
                    </td>
                    <td style={{ fontSize:'.78rem', color:'#64748b', whiteSpace:'nowrap' }}>
                      {t.start_date ? new Date(t.start_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '—'}
                    </td>
                    <td style={{ fontSize:'.78rem', color:'#64748b', whiteSpace:'nowrap' }}>
                      {t.end_date ? new Date(t.end_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '—'}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type:'form', ticket:t })}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setModal({ type:'delete', ticket:t })}>Delete</button>
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
        <TicketFormModal ticket={modal.ticket} epicId={id} resources={resources}
          onSave={handleSave} onClose={() => setModal(null)} saving={saving} />
      )}
      {modal?.type === 'delete' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header"><h3>Delete Ticket</h3><button className="modal-close" onClick={() => setModal(null)}>&times;</button></div>
            <div className="modal-body"><p>Delete <strong>ZPM-{modal.ticket.ticket_no}</strong>: {modal.ticket.title}?</p></div>
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
