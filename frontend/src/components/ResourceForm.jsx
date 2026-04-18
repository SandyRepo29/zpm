import { useState, useEffect } from 'react';

const DEPARTMENTS = [
  { code: 'BE', label: 'BE — Backend' },
  { code: 'FE', label: 'FE — Frontend' },
  { code: 'AR', label: 'AR — Architecture' },
  { code: 'QM', label: 'QM — Quality Manual' },
  { code: 'QA', label: 'QA — Quality Automation' },
  { code: 'RE', label: 'RE — Release Engineers' },
  { code: 'EM', label: 'EM — Engg Managers' },
];

const EMPTY = { first_name: '', last_name: '', job_title: '', department: '', location: '', is_active: true };

export default function ResourceForm({ resource, onSave, onClose, saving }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(resource
      ? { first_name: resource.first_name, last_name: resource.last_name, job_title: resource.job_title || '',
          department: resource.department, location: resource.location || '', is_active: resource.is_active ?? true }
      : EMPTY);
    setErrors({});
  }, [resource]);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
  };

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Required';
    if (!form.last_name.trim())  errs.last_name  = 'Required';
    if (!form.department)        errs.department  = 'Required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, job_title: form.job_title.trim() || null, location: form.location.trim() || null });
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{resource ? 'Edit Resource' : 'Add Resource'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input className={`form-control ${errors.first_name ? 'error' : ''}`}
                  value={form.first_name} onChange={set('first_name')} placeholder="e.g. Jane" autoFocus />
                {errors.first_name && <p className="field-error">{errors.first_name}</p>}
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input className={`form-control ${errors.last_name ? 'error' : ''}`}
                  value={form.last_name} onChange={set('last_name')} placeholder="e.g. Smith" />
                {errors.last_name && <p className="field-error">{errors.last_name}</p>}
              </div>
            </div>

            <div className="form-group">
              <label>Job Title</label>
              <input className="form-control" value={form.job_title} onChange={set('job_title')}
                placeholder="e.g. Sr. Software Engineer" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department *</label>
                <select className={`form-control ${errors.department ? 'error' : ''}`}
                  value={form.department} onChange={set('department')}>
                  <option value="">Select…</option>
                  {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                </select>
                {errors.department && <p className="field-error">{errors.department}</p>}
              </div>
              <div className="form-group">
                <label>Location</label>
                <input className="form-control" value={form.location} onChange={set('location')}
                  placeholder="e.g. Pune" />
              </div>
            </div>

            <div className="form-group form-check">
              <label className="check-label">
                <input type="checkbox" checked={form.is_active} onChange={set('is_active')} />
                Active
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : resource ? 'Update' : 'Add Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
