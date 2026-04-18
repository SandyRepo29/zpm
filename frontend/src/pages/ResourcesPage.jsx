import { useState, useEffect, useCallback } from 'react';
import ResourceTable from '../components/ResourceTable.jsx';
import ResourceForm from '../components/ResourceForm.jsx';
import DeleteConfirm from '../components/DeleteConfirm.jsx';
import { ToastContainer } from '../components/Toast.jsx';
import { getResources, createResource, updateResource, deleteResource } from '../api/resources.js';

const DEPARTMENTS = ['BE', 'FE', 'AR', 'QM', 'QA', 'RE', 'EM'];
let toastSeq = 0;

export default function ResourcesPage() {
  const [resources, setResources]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [deptFilter, setDeptFilter]     = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [modal, setModal]               = useState(null);
  const [saving, setSaving]             = useState(false);
  const [toasts, setToasts]             = useState([]);

  const addToast = (message, type = 'success') =>
    setToasts(t => [...t, { id: ++toastSeq, message, type }]);
  const removeToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getResources({ search, department: deptFilter });
      const filtered = activeFilter === 'active'   ? data.filter(r => r.is_active)
                     : activeFilter === 'inactive' ? data.filter(r => !r.is_active)
                     : data;
      setResources(filtered);
    } catch {
      addToast('Failed to load resources', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, activeFilter]);

  useEffect(() => {
    const id = setTimeout(fetchResources, 300);
    return () => clearTimeout(id);
  }, [fetchResources]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modal.resource) {
        const updated = await updateResource(modal.resource.id, form);
        setResources(r => r.map(x => x.id === updated.id ? updated : x));
        addToast('Resource updated');
      } else {
        const created = await createResource(form);
        setResources(r => [...r, created]);
        addToast('Resource added');
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
      await deleteResource(modal.resource.id);
      setResources(r => r.filter(x => x.id !== modal.resource.id));
      addToast('Resource deleted');
      setModal(null);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deptCounts  = DEPARTMENTS.reduce((acc, d) => { acc[d] = resources.filter(r => r.department === d).length; return acc; }, {});
  const activeCount   = resources.filter(r => r.is_active).length;
  const inactiveCount = resources.filter(r => !r.is_active).length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Resources</h1>
          <p className="page-subtitle">Manage your engineering team members</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>All Resources ({resources.length})</h2>
          <div className="toolbar">
            <input className="search-input" placeholder="Search by name…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <select className="filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="filter-select" value={activeFilter} onChange={e => setActiveFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="btn btn-primary" onClick={() => setModal({ type: 'form', resource: null })}>
              + Add Resource
            </button>
          </div>
        </div>

        {!loading && resources.length > 0 && (
          <div className="stats">
            <span className="stat"><strong>{activeCount}</strong> active</span>
            {inactiveCount > 0 && <span className="stat"><strong>{inactiveCount}</strong> inactive</span>}
            <span className="stat-sep" />
            {DEPARTMENTS.filter(d => deptCounts[d] > 0).map(d => (
              <span key={d} className="stat">
                <span className={`badge badge-${d}`}>{d}</span>{' '}
                <strong>{deptCounts[d]}</strong>
              </span>
            ))}
          </div>
        )}

        <ResourceTable resources={resources} loading={loading}
          onEdit={(r) => setModal({ type: 'form', resource: r })}
          onDelete={(r) => setModal({ type: 'delete', resource: r })} />
      </div>

      {modal?.type === 'form' && (
        <ResourceForm resource={modal.resource} onSave={handleSave}
          onClose={() => setModal(null)} saving={saving} />
      )}
      {modal?.type === 'delete' && (
        <DeleteConfirm resource={modal.resource} onConfirm={handleDelete}
          onClose={() => setModal(null)} deleting={saving} />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
