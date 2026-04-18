import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResources } from '../api/resources';
import { getTeams } from '../api/teams';

const DEPT_LABELS = { BE:'Backend', FE:'Frontend', AR:'Architecture', QM:'Quality Manual', QA:'Quality Automation', RE:'Release Engineers', EM:'Engg Managers' };
const DEPT_ORDER  = ['BE','FE','AR','QM','QA','RE','EM'];

export default function HomePage() {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [teams, setTeams]         = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([getResources(), getTeams()])
      .then(([r, t]) => { setResources(r); setTeams(t); })
      .finally(() => setLoading(false));
  }, []);

  const active   = resources.filter(r => r.is_active).length;
  const inactive = resources.filter(r => !r.is_active).length;

  const deptCounts = DEPT_ORDER.reduce((acc, d) => {
    acc[d] = resources.filter(r => r.department === d).length;
    return acc;
  }, {});

  const STAT_CARDS = [
    { label: 'Total Resources', value: resources.length, sub: `${active} active · ${inactive} inactive`, color: '#3b82f6', path: '/resources' },
    { label: 'Teams',           value: teams.length,     sub: `${teams.reduce((s,t)=>s+t.member_count,0)} total assignments`, color: '#8b5cf6', path: '/teams' },
    { label: 'Epics',           value: '—',              sub: 'Coming soon',    color: '#f59e0b', path: '/epics' },
    { label: 'Releases',        value: '—',              sub: 'Coming soon',    color: '#10b981', path: '/releases' },
  ];

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>Welcome to ZPM</h1>
        <p>Zimbra Core Engineering · Resource &amp; Release Management</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--gray-600)' }}>Loading…</p>
      ) : (
        <>
          <div className="stat-cards">
            {STAT_CARDS.map(card => (
              <button key={card.label} className="stat-card" onClick={() => navigate(card.path)}>
                <div className="stat-card-accent" style={{ background: card.color }} />
                <div className="stat-card-body">
                  <p className="stat-card-label">{card.label}</p>
                  <p className="stat-card-value">{card.value}</p>
                  <p className="stat-card-sub">{card.sub}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="home-grid">
            <div className="home-section">
              <h2>Team Breakdown</h2>
              <div className="dept-breakdown">
                {DEPT_ORDER.filter(d => deptCounts[d] > 0).map(d => (
                  <div key={d} className="dept-row">
                    <span className={`badge badge-${d}`}>{d}</span>
                    <span className="dept-name">{DEPT_LABELS[d]}</span>
                    <div className="dept-bar-wrap">
                      <div className="dept-bar" style={{ width: `${(deptCounts[d] / resources.length) * 100}%` }} />
                    </div>
                    <span className="dept-count">{deptCounts[d]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="home-section">
              <h2>Teams</h2>
              {teams.length === 0 ? (
                <div className="empty-state">
                  <p>No teams yet.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/teams')}>Create a Team</button>
                </div>
              ) : (
                <div className="team-list-home">
                  {teams.slice(0, 6).map(t => (
                    <div key={t.id} className="team-row-home" onClick={() => navigate('/teams')}>
                      <div className="team-avatar">{t.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="team-name-home">{t.name}</p>
                        <p className="team-meta-home">{t.member_count} member{t.member_count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  ))}
                  {teams.length > 6 && (
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/teams')}>
                      +{teams.length - 6} more
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
