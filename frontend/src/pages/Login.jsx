import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClipboardList } from 'lucide-react';
import '../styles/Login.css';

const Login = ({ onToast }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register Form
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerRole, setRegisterRole] = useState('MEMBER'); // Default MEMBER

  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      onToast('Please fill in all fields', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      onToast('Welcome back!', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || 'Invalid email or password';
      onToast(typeof errMsg === 'string' ? errMsg : 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword || !registerName || !registerRole) {
      onToast('Please fill in all fields', 'error');
      return;
    }
    if (registerPassword.length < 6) {
      onToast('Password must be at least 6 characters long', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await register(registerEmail, registerPassword, registerName, registerRole);
      onToast('Registration successful! Please login.', 'success');
      setIsLogin(true); // Switch to login tab
      setLoginEmail(registerEmail);
      setLoginPassword('');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || 'Registration failed';
      onToast(typeof errMsg === 'string' ? errMsg : 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (email, password) => {
    setLoginEmail(email);
    setLoginPassword(password);
    setIsLogin(true);
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        <div className="login-logo text-gradient" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <ClipboardList size={32} style={{ color: 'var(--color-primary)' }} />
          <span>Sisenco Digital</span>
        </div>
        <p className="login-subtitle">Weekly Reports & Metrics Dashboard</p>

        <div className="auth-tabs">
          <button 
            type="button" 
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            type="button" 
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                value={registerName} 
                onChange={(e) => setRegisterName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={registerEmail} 
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password (min 6 chars)</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={registerPassword} 
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>System Role</label>
              <select 
                value={registerRole} 
                onChange={(e) => setRegisterRole(e.target.value)}
                required
              >
                <option value="MEMBER">Team Member (Submit Reports)</option>
                <option value="MANAGER">Manager / Admin (Analyze Reports)</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="demo-credentials">
          <div className="demo-credentials-title">⚡ Quick Demo Logins</div>
          <p style={{ cursor: 'pointer' }} onClick={() => fillDemoCredentials('manager@example.com', 'manager123')}>
            Manager: <strong>manager@example.com</strong> / <code>manager123</code> (Click to fill)
          </p>
          <p style={{ cursor: 'pointer' }} onClick={() => fillDemoCredentials('member@example.com', 'member123')}>
            Member: <strong>member@example.com</strong> / <code>member123</code> (Click to fill)
          </p>
          <p style={{ cursor: 'pointer' }} onClick={() => fillDemoCredentials('dev@example.com', 'member123')}>
            Member 2: <strong>dev@example.com</strong> / <code>member123</code> (Click to fill)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
