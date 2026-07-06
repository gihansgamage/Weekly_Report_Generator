import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Reports from './pages/Reports';
import ReportHistory from './pages/ReportHistory';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Submissions from './pages/Submissions';
import ActivityLogs from './pages/ActivityLogs';
import AllReports from './pages/AllReports';
import Approvals from './pages/Approvals';
import Profile from './pages/Profile';
import ChatWidget from './components/ChatWidget';
import Toast from './components/Toast';
import './styles/globals.css';

const MainApp = () => {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('');
  const [toast, setToast] = useState(null);
  const [editingDraftWeek, setEditingDraftWeek] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  React.useEffect(() => {
    if (user) {
      setActivePage(user.role === 'MANAGER' ? 'dashboard' : 'reports');
    } else {
      setActivePage('');
    }
  }, [user]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '15px' }}>
        <div className="pulsing-dot" style={{ width: '20px', height: '20px', backgroundColor: 'var(--color-primary)' }}></div>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Syncing Session...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onToast={showToast} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      </>
    );
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return user.role === 'MANAGER' ? <Dashboard onToast={showToast} /> : <Reports onToast={showToast} editingDraftWeek={editingDraftWeek} setEditingDraftWeek={setEditingDraftWeek} />;
      case 'submissions':
        return user.role === 'MANAGER' ? <Submissions onToast={showToast} /> : <Reports onToast={showToast} editingDraftWeek={editingDraftWeek} setEditingDraftWeek={setEditingDraftWeek} />;
      case 'all_reports':
        return user.role === 'MANAGER' ? <AllReports onToast={showToast} /> : <Reports onToast={showToast} editingDraftWeek={editingDraftWeek} setEditingDraftWeek={setEditingDraftWeek} />;
      case 'approvals':
        return user.role === 'MANAGER' ? <Approvals onToast={showToast} /> : <Reports onToast={showToast} editingDraftWeek={editingDraftWeek} setEditingDraftWeek={setEditingDraftWeek} />;
      case 'profile':
        return <Profile onToast={showToast} />;
      case 'activity':
        return <ActivityLogs onToast={showToast} />;
      case 'projects':
        return user.role === 'MANAGER' ? <Projects onToast={showToast} /> : <Reports onToast={showToast} editingDraftWeek={editingDraftWeek} setEditingDraftWeek={setEditingDraftWeek} />;
      case 'reports':
        return <Reports onToast={showToast} editingDraftWeek={editingDraftWeek} setEditingDraftWeek={setEditingDraftWeek} />;
      case 'history':
        return <ReportHistory onToast={showToast} onEditDraft={(week) => {
          setEditingDraftWeek(week);
          setActivePage('reports');
        }} />;
      default:
        return user.role === 'MANAGER' ? <Dashboard onToast={showToast} /> : <Reports onToast={showToast} editingDraftWeek={editingDraftWeek} setEditingDraftWeek={setEditingDraftWeek} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}>
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto', boxSizing: 'border-box' }}>
        {renderActivePage()}
      </main>

      {user.role === 'MANAGER' && <ChatWidget />}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
