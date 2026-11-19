import { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useStudy } from '../context/StudyContext.jsx';

const links = [
  { to: '/', label: 'Dashboard', icon: 'home', end: true },
  { to: '/materials', label: 'Materials', icon: 'library' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/revise', label: 'Revise', icon: 'refresh' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

// Light / dark theme. The initial value is set in index.html before the first paint.
function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('studyflow.theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

export default function Layout() {
  const { apiKey } = useStudy();
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const [theme, toggleTheme] = useTheme();
  const dark = theme === 'dark';

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

        <nav className="nav" aria-label="Main">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon name={link.icon} size={19} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="avatar user-avatar" aria-hidden="true">
              {user.name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="user-info">
              <strong>{user.name}</strong>
              <span className="muted small">{user.email}</span>
            </div>
            <button
              className="icon-btn"
              aria-label="Log out"
              title="Log out"
              onClick={() => {
                logOut();
                navigate('/');
              }}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}>
            <Icon name={dark ? 'sun' : 'moon'} size={18} />
            <span>{dark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <p className="sidebar-note">Understand → Practice → Find weak areas → Revise</p>
        </div>
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
