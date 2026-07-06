import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, ClipboardList } from 'lucide-react';
import api from '../utils/api';
import '../styles/Components.css';

const Navbar = ({ activePage, setActivePage }) => {
  const { user, logout } = useAuth();
  const [hasUnread, setHasUnread] = React.useState(false);

  React.useEffect(() => {
    if (!user || user.role !== 'MANAGER') return;

    const checkUnread = async () => {
      try {
        const res = await api.get('/reports');
        const unread = res.data.some(r => r.status === 'SUBMITTED' && !r.readByManager);
        setHasUnread(unread);
      } catch (err) {
        console.error(err);
      }
    };

    checkUnread();
    
    // Poll for new submissions every 15 seconds to show real-time notifications
    const interval = setInterval(checkUnread, 15000);
    return () => clearInterval(interval);
  }, [user, activePage]);

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
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Team Submissions
              {hasUnread && (
                <span 
                  style={{ 
                    width: '8px', 
                    height: '8px', 
                    background: 'var(--color-danger)', 
                    borderRadius: '50%', 
                    display: 'inline-block',
                    boxShadow: '0 0 6px var(--color-danger)'
                  }} 
                  title="Unread Submissions"
                />
              )}
            </button>
            <button
              onClick={() => setActivePage('all_reports')}
              className={`nav-link ${activePage === 'all_reports' ? 'active' : ''}`}
            >
              All Reports
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
