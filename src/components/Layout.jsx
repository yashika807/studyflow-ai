import { NavLink, Link, Outlet } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useStudy } from '../context/StudyContext.jsx';

const links = [
  { to: '/', label: 'Dashboard', icon: 'home', end: true },
  { to: '/materials', label: 'Materials', icon: 'library' },
  { to: '/revise', label: 'Revise', icon: 'refresh' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Layout() {
  const { apiKey } = useStudy();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Icon name="logo" size={22} />
          </span>
          <span>
            StudyFlow <strong>AI</strong>
          </span>
        </Link>

        <nav className="nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon name={link.icon} size={18} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <p className="sidebar-note">Understand → Practice → Find weak areas → Revise</p>
      </aside>

      <main className="main">
        {!apiKey && (
          <div className="banner">
            <Icon name="sparkle" size={16} />
            <span>
              AI features need a free Gemini API key. <Link to="/settings">Add it in Settings</Link> — or try the sample material, which works without one.
            </span>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
