import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import '../styles/Login.css';
import '../styles/Reports.css';

const Login = ({ onToast }) => {
  const { login, googleLogin, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register Form
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerRole, setRegisterRole] = useState('MEMBER'); // Default MEMBER

  // Live checking states
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameChecking, setUsernameChecking] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Google GSI Client ClientID
  const [googleClientId, setGoogleClientId] = useState('');

  // Fetch Google Client ID and initialize real Sign-In button
  useEffect(() => {
    let intervalId = null;
    
    const initGoogle = async () => {
      try {
        const res = await api.get('/auth/google-client-id');
        const clientId = res.data.clientId;
        if (!clientId) {
          console.warn("Google Client ID is empty or not configured on the backend.");
          return;
        }
        setGoogleClientId(clientId);
        
        // Poll for window.google to load from index.html head
        let attempts = 0;
        intervalId = setInterval(() => {
          attempts++;
          if (window.google && window.google.accounts) {
            clearInterval(intervalId);
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleCredentialResponse
            });
            window.google.accounts.id.renderButton(
              document.getElementById("google-signin-btn"),
              { theme: "outline", size: "large", width: 360 }
            );
          } else if (attempts > 50) {
            clearInterval(intervalId);
            console.error("Google GSI script could not be found within 5 seconds.");
          }
        }, 100);
      } catch (err) {
        console.error("Failed to load Google Client ID", err);
      }
    };

    if (isLogin) {
      initGoogle();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLogin]);

  // Google token callback
  const handleCredentialResponse = async (response) => {
    setIsLoading(true);
    try {
      await googleLogin(response.credential);
      onToast('Logged in successfully with Google!', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || 'Google Sign-in failed';
      onToast(typeof errMsg === 'string' ? errMsg : 'Google login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced check username
  useEffect(() => {
    if (registerUsername.trim().length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setUsernameChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-username?username=${registerUsername.trim()}`);
        setUsernameAvailable(res.data.available);
      } catch (err) {
        console.error(err);
        setUsernameAvailable(false);
      } finally {
        setUsernameChecking(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [registerUsername]);

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
      const errMsg = err.response?.data?.message || err.response?.data || 'Invalid credentials or unapproved account';
      onToast(typeof errMsg === 'string' ? errMsg : 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerEmail || !registerUsername || !registerPassword || !registerName || !registerRole) {
      onToast('Please fill in all fields', 'error');
      return;
    }
    if (registerUsername.trim().length < 3) {
      onToast('Username must be at least 3 characters long', 'error');
      return;
    }
    if (usernameAvailable === false) {
      onToast('Username is already taken!', 'error');
      return;
    }
    if (registerPassword.length < 6) {
      onToast('Password must be at least 6 characters long', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await register(registerEmail, registerUsername.trim().toLowerCase(), registerPassword, registerName, registerRole);
      onToast('Registration submitted! Awaiting administrator approval.', 'success');
      setIsLogin(true); // Switch to login tab
      setLoginEmail(registerUsername);
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
      <div className="login-card glass-panel animate-fade-in" style={{ padding: '30px 40px' }}>
        <div className="login-logo text-gradient" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <ClipboardList size={32} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 700 }}>Sisenco Digital</span>
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
              <label>Email Address or Username</label>
              <input 
                type="text" 
                placeholder="you@example.com or username" 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showLoginPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ paddingRight: '40px', width: '100%' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                    margin: 0
                  }}
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
              <label>Username</label>
              <input 
                type="text" 
                placeholder="john_doe" 
                value={registerUsername} 
                onChange={(e) => setRegisterUsername(e.target.value)}
                required
              />
              {registerUsername.trim().length >= 3 && (
                <div style={{ fontSize: '0.8rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {usernameChecking ? (
                    <span style={{ color: 'var(--text-secondary)' }}>Checking availability...</span>
                  ) : usernameAvailable ? (
                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>✓ Username is available</span>
                  ) : (
                    <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>✗ Username is already taken</span>
                  )}
                </div>
              )}
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
              <div style={{ position: 'relative' }}>
                <input 
                  type={showRegisterPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={registerPassword} 
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  style={{ paddingRight: '40px', width: '100%' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                    margin: 0
                  }}
                >
                  {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
            <button type="submit" className="btn-primary" disabled={isLoading || (registerUsername.trim().length >= 3 && !usernameAvailable)}>
              {isLoading ? 'Submitting registration...' : 'Submit Request'}
            </button>
          </form>
        )}

        {/* OR Google Login Button */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--text-secondary)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
          <span style={{ padding: '0 10px', fontSize: '0.8rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
        </div>

        {isLogin && (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '15px' }}>
            <div id="google-signin-btn" style={{ width: '100%', minHeight: '40px' }}></div>
          </div>
        )}

        <div className="demo-credentials">
          <div className="demo-credentials-title">⚡ Quick Demo Logins</div>
          <p style={{ cursor: 'pointer' }} onClick={() => fillDemoCredentials('manager', 'manager123')}>
            Manager Username: <strong>manager</strong> / <code>manager123</code> (Click to fill)
          </p>
          <p style={{ cursor: 'pointer' }} onClick={() => fillDemoCredentials('member', 'member123')}>
            Member Username: <strong>member</strong> / <code>member123</code> (Click to fill)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
