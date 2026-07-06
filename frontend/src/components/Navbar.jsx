import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, ClipboardList } from 'lucide-react';
import '../styles/Components.css';

const Navbar = ({ activePage, setActivePage }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isManager = user.role === 'MANAGER';

  return (
    <nav className="navbar">
      <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => setActivePage(isManager ? 'dashboard' : 'reports')}>
        <ClipboardList size={24} style={{ color: 'var(--color-primary)' }} />
        <span className="text-gradient" style={{ fontWeight: 700 }}>Sisenco Digital</span>
      </div>

      <div className="nav-links">
        {isManager ? (
          <>
            <button
              onClick={() => setActivePage('dashboard')}
              className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActivePage('submissions')}
              className={`nav-link ${activePage === 'submissions' ? 'active' : ''}`}
            >
              Team Submissions
            </button>
            <button
              onClick={() => setActivePage('activity')}
              className={`nav-link ${activePage === 'activity' ? 'active' : ''}`}
            >
              Activity Logs
            </button>
            <button
              onClick={() => setActivePage('projects')}
              className={`nav-link ${activePage === 'projects' ? 'active' : ''}`}
            >
              Projects
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActivePage('reports')}
              className={`nav-link ${activePage === 'reports' ? 'active' : ''}`}
            >
              Weekly Report
            </button>
            <button
              onClick={() => setActivePage('history')}
              className={`nav-link ${activePage === 'history' ? 'active' : ''}`}
            >
              My Reports
            </button>
            <button
              onClick={() => setActivePage('activity')}
              className={`nav-link ${activePage === 'activity' ? 'active' : ''}`}
            >
              Activity Logs
            </button>
          </>
        )}
      </div>

      <div className="nav-profile">
        <div className="nav-user-info">
          <div className="nav-user-name">{user.name}</div>
          <div className="nav-user-role">{user.role}</div>
        </div>
        <button className="btn-logout" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
