import { NavLink } from 'react-router-dom';

const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const IconTeam = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
);
const IconEpic = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconRelease = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
  </svg>
);

const NAV_MAIN = [
  { to: '/',          label: 'Home',      Icon: IconHome,  exact: true },
  { to: '/resources', label: 'Resources', Icon: IconUsers },
  { to: '/teams',     label: 'Teams',     Icon: IconTeam  },
];

const NAV_MODULES = [
  { to: '/epics',    label: 'Epics',    Icon: IconEpic    },
  { to: '/releases', label: 'Releases', Icon: IconRelease },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">Z</div>
        <div>
          <div className="sidebar-product">ZPM</div>
          <div className="sidebar-sub">Zimbra Project Manager</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section-label">MAIN</p>
        {NAV_MAIN.map(({ to, label, Icon, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <Icon /><span>{label}</span>
          </NavLink>
        ))}

        <p className="sidebar-section-label" style={{ marginTop: 24 }}>MODULES</p>
        {NAV_MODULES.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <Icon /><span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>Zimbra · Core Engineering</span>
      </div>
    </aside>
  );
}
