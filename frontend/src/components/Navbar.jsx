import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  ClipboardList, 
  LayoutDashboard, 
  ClipboardCheck, 
  FolderHeart, 
  UserCheck, 
  FileClock, 
  Briefcase, 
  User, 
  FilePlus, 
  History, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import api from '../utils/api';
import '../styles/Components.css';

const Navbar = ({ activePage, setActivePage, isCollapsed, setIsCollapsed }) => {
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
    
    // Poll for unread status
    const interval = setInterval(checkUnread, 15000);
    return () => clearInterval(interval);
  }, [user, activePage]);

  if (!user) return null;

  const isManager = user.role === 'MANAGER';

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <div>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div 
            className="sidebar-brand" 
            onClick={() => setActivePage(isManager ? 'dashboard' : 'reports')}
            title="Sisenco Digital Portal"
          >
            <ClipboardList size={26} style={{ color: 'var(--color-primary)' }} />
            <span className="sidebar-brand-text text-gradient">Sisenco</span>
          </div>
          <button 
            type="button" 
            className="sidebar-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Links (No Profile Tab) */}
        <div className="sidebar-links">
          {isManager ? (
            <>
              <button
                type="button"
                onClick={() => setActivePage('dashboard')}
                className={`sidebar-link ${activePage === 'dashboard' ? 'active' : ''}`}
                title="Dashboard"
              >
                <LayoutDashboard size={20} />
                <span className="sidebar-link-text">Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePage('submissions')}
                className={`sidebar-link ${activePage === 'submissions' ? 'active' : ''}`}
                title="Team Submissions"
              >
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <ClipboardCheck size={20} />
                  {hasUnread && (
                    <span 
                      style={{ 
                        width: '6px', 
                        height: '6px', 
                        background: 'var(--color-danger)', 
                        borderRadius: '50%', 
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        boxShadow: '0 0 6px var(--color-danger)'
                      }} 
                    />
                  )}
                </div>
                <span className="sidebar-link-text" style={{ marginLeft: isCollapsed ? '0px' : '4px' }}>Team Submissions</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePage('all_reports')}
                className={`sidebar-link ${activePage === 'all_reports' ? 'active' : ''}`}
                title="All Reports"
              >
                <FolderHeart size={20} />
                <span className="sidebar-link-text">All Reports</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePage('approvals')}
                className={`sidebar-link ${activePage === 'approvals' ? 'active' : ''}`}
                title="Pending Approvals"
              >
                <UserCheck size={20} />
                <span className="sidebar-link-text">Approvals</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePage('activity')}
                className={`sidebar-link ${activePage === 'activity' ? 'active' : ''}`}
                title="Activity Logs"
              >
                <FileClock size={20} />
                <span className="sidebar-link-text">Activity Logs</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePage('projects')}
                className={`sidebar-link ${activePage === 'projects' ? 'active' : ''}`}
                title="Manage Projects"
              >
                <Briefcase size={20} />
                <span className="sidebar-link-text">Projects</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActivePage('reports')}
                className={`sidebar-link ${activePage === 'reports' ? 'active' : ''}`}
                title="Weekly Reports"
              >
                <FilePlus size={20} />
                <span className="sidebar-link-text">Weekly Report</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePage('history')}
                className={`sidebar-link ${activePage === 'history' ? 'active' : ''}`}
                title="My Submission History"
              >
                <History size={20} />
                <span className="sidebar-link-text">My Reports</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePage('activity')}
                className={`sidebar-link ${activePage === 'activity' ? 'active' : ''}`}
                title="Activity Logs"
              >
                <FileClock size={20} />
                <span className="sidebar-link-text">Activity Logs</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sidebar Footer (Acts as Clickable Profile Trigger) */}
      <div className="sidebar-footer">
        <div 
          className={`sidebar-profile ${activePage === 'profile' ? 'active-profile' : ''}`} 
          onClick={() => setActivePage('profile')}
          title={`Signed in as ${user.name} (${user.role}) - Click to manage settings`}
        >
          <div className="sidebar-user-avatar">
            {getInitials(user.name)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
        </div>
        <button 
          className="sidebar-btn-logout" 
          onClick={logout} 
          title="Sign out of portal"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Navbar;
