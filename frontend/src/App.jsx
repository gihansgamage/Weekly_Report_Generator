import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Reports from './pages/Reports';
import ReportHistory from './pages/ReportHistory';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ChatWidget from './components/ChatWidget';
import Toast from './components/Toast';
import './styles/globals.css';

const MainApp = () => {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('');
  const [toast, setToast] = useState(null);

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
        return user.role === 'MANAGER' ? <Dashboard onToast={showToast} /> : <Reports onToast={showToast} />;
      case 'projects':
        return user.role === 'MANAGER' ? <Projects onToast={showToast} /> : <Reports onToast={showToast} />;
      case 'reports':
        return <Reports onToast={showToast} />;
      case 'history':
        return <ReportHistory onToast={showToast} />;
      default:
        return user.role === 'MANAGER' ? <Dashboard onToast={showToast} /> : <Reports onToast={showToast} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      
      <main style={{ flex: 1 }}>
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
