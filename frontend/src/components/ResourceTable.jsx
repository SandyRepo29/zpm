const DEPT_LABELS = {
  BE: 'Backend', FE: 'Frontend', AR: 'Architecture',
  QM: 'Quality Manual', QA: 'Quality Automation',
  RE: 'Release Engineers', EM: 'Engg Managers',
};

export default function ResourceTable({ resources, loading, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Job Title</th>
            <th>Dept</th>
            <th>Location</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="state-row"><td colSpan={7}>Loading resources…</td></tr>
          ) : resources.length === 0 ? (
            <tr className="state-row"><td colSpan={7}>No resources found.</td></tr>
          ) : (
            resources.map((r, i) => (
              <tr key={r.id} style={{ opacity: r.is_active ? 1 : 0.5 }}>
                <td style={{ color: 'var(--gray-600)', fontSize: '.8rem' }}>{i + 1}</td>
                <td>
                  <span style={{ fontWeight: 500 }}>{r.first_name} {r.last_name}</span>
                </td>
                <td style={{ color: 'var(--gray-600)', fontSize: '.82rem' }}>{r.job_title || '—'}</td>
                <td>
                  <span className={`badge badge-${r.department}`}>{r.department}</span>
                  <span style={{ marginLeft: 6, color: 'var(--gray-600)', fontSize: '.78rem' }}>
                    {DEPT_LABELS[r.department]}
                  </span>
                </td>
                <td style={{ fontSize: '.82rem' }}>{r.location || '—'}</td>
                <td>
                  <span className={`status-pill ${r.is_active ? 'active' : 'inactive'}`}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => onEdit(r)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(r)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
