import { useState, useEffect } from 'react';
import { getTeams, createTeam, updateTeam, deleteTeam, getTeam, addMember, removeMember } from '../api/teams.js';
import { getResources } from '../api/resources.js';
import { ToastContainer } from '../components/Toast.jsx';

const DEPT_COLORS = { BE:'#dbeafe', FE:'#fce7f3', AR:'#ede9fe', QM:'#d1fae5', QA:'#ecfccb', RE:'#ffedd5', EM:'#e0e7ff' };
const DEPT_TEXT   = { BE:'#1d4ed8', FE:'#9d174d', AR:'#5b21b6', QM:'#065f46', QA:'#3f6212', RE:'#9a3412', EM:'#3730a3' };

let toastSeq = 0;

// ── Team Form Modal ──────────────────────────────────────────────────────────
function TeamFormModal({ team, onSave, onClose, saving }) {
  const [name, setName]     = useState(team?.name || '');
  const [desc, setDesc]     = useState(team?.description || '');
  const [error, setError]   = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Team name is required'); return; }
    onSave({ name: name.trim(), description: desc.trim() || null });
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{team ? 'Edit Team' : 'Create Team'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Team Name *</label>
              <input className={`form-control ${error ? 'error' : ''}`}
                value={name} onChange={e => { setName(e.target.value); setError(''); }}
                placeholder="e.g. Bravo, Avenger, Marvel" autoFocus />
              {error && <p className="field-error">{error}</p>}
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={3}
                value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="Optional team description…" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : team ? 'Update' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Team Detail Modal ────────────────────────────────────────────────────────
function TeamDetailModal({ team, onClose, onUpdate }) {
  const [detail, setDetail]       = useState(team);
  const [allResources, setAll]    = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [tab, setTab]             = useState('members'); // 'members' | 'add'

  useEffect(() => {
    getResources().then(setAll);
  }, []);

  const memberIds = new Set(detail.members.map(m => m.id));
  const available = allResources.filter(r =>
    !memberIds.has(r.id) &&
    (r.first_name + ' ' + r.last_name).toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (resource_id) => {
    setLoading(true);
    try {
      const updated = await addMember(detail.id, resource_id);
      setDetail(updated);
      onUpdate(updated);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (resource_id) => {
    setLoading(true);
    try {
      const updated = await removeMember(detail.id, resource_id);
      setDetail(updated);
      onUpdate(updated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="team-avatar-lg">{detail.name.charAt(0).toUpperCase()}</div>
            <div>
              <h3>{detail.name}</h3>
              {detail.description && <p style={{ fontSize: '.82rem', color: 'var(--gray-600)', marginTop: 2 }}>{detail.description}</p>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="detail-tabs">
          <button className={`detail-tab${tab === 'members' ? ' active' : ''}`} onClick={() => setTab('members')}>
            Members ({detail.members.length})
          </button>
          <button className={`detail-tab${tab === 'add' ? ' active' : ''}`} onClick={() => setTab('add')}>
            Add Members ({available.length})
          </button>
        </div>

        <div className="modal-body" style={{ padding: 0, maxHeight: 420, overflowY: 'auto' }}>
          {tab === 'members' ? (
            detail.members.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-600)' }}>
                No members yet. Switch to "Add Members" to get started.
              </div>
            ) : (
              <table className="detail-table">
                <thead>
                  <tr><th>Name</th><th>Title</th><th>Dept</th><th>Location</th><th></th></tr>
                </thead>
                <tbody>
                  {detail.members.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="member-avatar">{m.first_name.charAt(0)}{m.last_name.charAt(0)}</div>
                          <span style={{ fontWeight: 500 }}>{m.first_name} {m.last_name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '.82rem', color: 'var(--gray-600)' }}>{m.job_title || '—'}</td>
                      <td><span className={`badge badge-${m.department}`}>{m.department}</span></td>
                      <td style={{ fontSize: '.82rem' }}>{m.location || '—'}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleRemove(m.id)} disabled={loading}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-200)' }}>
                <input className="search-input" style={{ width: '100%' }}
                  placeholder="Search resources…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {available.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-600)' }}>
                  {search ? 'No matching resources.' : 'All resources are already in this team.'}
                </div>
              ) : (
                <table className="detail-table">
                  <thead>
                    <tr><th>Name</th><th>Title</th><th>Dept</th><th></th></tr>
                  </thead>
                  <tbody>
                    {available.map(r => (
                      <tr key={r.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="member-avatar">{r.first_name.charAt(0)}{r.last_name.charAt(0)}</div>
                            <span style={{ fontWeight: 500 }}>{r.first_name} {r.last_name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '.82rem', color: 'var(--gray-600)' }}>{r.job_title || '—'}</td>
                        <td><span className={`badge badge-${r.department}`}>{r.department}</span></td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => handleAdd(r.id)} disabled={loading}>
                            + Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Team Card ────────────────────────────────────────────────────────────────
function TeamCard({ team, onView, onEdit, onDelete }) {
  const depts = [...new Set(team.members?.map(m => m.department) || [])];

  return (
    <div className="team-card" onClick={() => onView(team)}>
      <div className="team-card-header">
        <div className="team-avatar">{team.name.charAt(0).toUpperCase()}</div>
        <div className="team-card-actions" onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(team)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(team)}>Delete</button>
        </div>
      </div>
      <h3 className="team-card-name">{team.name}</h3>
      {team.description && <p className="team-card-desc">{team.description}</p>}
      <p className="team-card-count">{team.member_count} member{team.member_count !== 1 ? 's' : ''}</p>
      {depts.length > 0 && (
        <div className="team-card-depts">
          {depts.map(d => <span key={d} className={`badge badge-${d}`}>{d}</span>)}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function TeamsPage() {
  const [teams, setTeams]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null); // { type: 'form'|'detail'|'delete', team }
  const [saving, setSaving]   = useState(false);
  const [toasts, setToasts]   = useState([]);

  const addToast = (message, type = 'success') =>
    setToasts(t => [...t, { id: ++toastSeq, message, type }]);
  const removeToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  useEffect(() => {
    getTeams().then(setTeams).finally(() => setLoading(false));
  }, []);

  const handleView = async (team) => {
    const full = await getTeam(team.id);
    setModal({ type: 'detail', team: full });
  };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modal.team && modal.type === 'form') {
        const updated = await updateTeam(modal.team.id, form);
        setTeams(ts => ts.map(t => t.id === updated.id ? { ...t, ...updated } : t));
        addToast('Team updated');
      } else {
        const created = await createTeam(form);
        setTeams(ts => [...ts, created]);
        addToast('Team created');
      }
      setModal(null);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteTeam(modal.team.id);
      setTeams(ts => ts.filter(t => t.id !== modal.team.id));
      addToast('Team deleted');
      setModal(null);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMemberUpdate = (updatedTeam) => {
    setTeams(ts => ts.map(t => t.id === updatedTeam.id
      ? { ...updatedTeam, member_count: updatedTeam.members.length }
      : t
    ));
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Teams</h1>
          <p className="page-subtitle">Create squads and assign resources</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'form', team: null })}>
          + Create Team
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--gray-600)' }}>Loading teams…</p>
      ) : teams.length === 0 ? (
        <div className="card empty-card">
          <div className="placeholder-icon" style={{ marginBottom: 12 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
              <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
            </svg>
          </div>
          <p style={{ color: 'var(--gray-600)', marginBottom: 12 }}>No teams yet. Create your first team.</p>
          <button className="btn btn-primary" onClick={() => setModal({ type: 'form', team: null })}>
            + Create Team
          </button>
        </div>
      ) : (
        <div className="teams-grid">
          {teams.map(team => (
            <TeamCard key={team.id} team={team}
              onView={handleView}
              onEdit={(t) => setModal({ type: 'form', team: t })}
              onDelete={(t) => setModal({ type: 'delete', team: t })} />
          ))}
        </div>
      )}

      {modal?.type === 'form' && (
        <TeamFormModal team={modal.team} onSave={handleSave}
          onClose={() => setModal(null)} saving={saving} />
      )}

      {modal?.type === 'detail' && (
        <TeamDetailModal team={modal.team} onClose={() => setModal(null)}
          onUpdate={handleMemberUpdate} />
      )}

      {modal?.type === 'delete' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Delete Team</h3>
              <button className="modal-close" onClick={() => setModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Delete <strong>{modal.team.name}</strong>? This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
