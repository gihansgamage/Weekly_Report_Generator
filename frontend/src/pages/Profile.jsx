import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { User, Shield, ShieldCheck, Mail, Key, UserCheck, RefreshCw, Eye, EyeOff } from 'lucide-react';
import '../styles/Reports.css';

const Profile = ({ onToast }) => {
  const { user } = useAuth();
  
  // Update Username states
  const [newUsername, setNewUsername] = useState('');
  const [usernameOtp, setUsernameOtp] = useState('');
  const [isUsernameOtpSent, setIsUsernameOtpSent] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  // Update Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordOtp, setPasswordOtp] = useState('');
  const [isPasswordOtpSent, setIsPasswordOtpSent] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Live check username
  useEffect(() => {
    if (newUsername.trim().length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setUsernameChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-username?username=${newUsername.trim()}`);
        setUsernameAvailable(res.data.available);
      } catch (err) {
        console.error(err);
        setUsernameAvailable(false);
      } finally {
        setUsernameChecking(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [newUsername]);

  const handleRequestOtp = async (type) => {
    setIsLoading(true);
    try {
      await api.post('/users/profile/request-otp');
      onToast('Verification OTP code sent to your email successfully!', 'success');
      if (type === 'username') {
        setIsUsernameOtpSent(true);
      } else {
        setIsPasswordOtpSent(true);
      }
    } catch (err) {
      onToast('Failed to send verification OTP code. Make sure SMTP is configured.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    if (!newUsername || !usernameOtp) {
      onToast('Please fill in all username fields', 'error');
      return;
    }
    if (newUsername.trim().length < 3) {
      onToast('Username must be at least 3 characters', 'error');
      return;
    }
    if (usernameAvailable === false) {
      onToast('Username is already taken!', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await api.put('/users/profile/update-username', {
        username: newUsername.trim().toLowerCase(),
        otp: usernameOtp.trim()
      });
      onToast('Username updated successfully! Please re-login with your new credentials.', 'success');
      setNewUsername('');
      setUsernameOtp('');
      setIsUsernameOtpSent(false);
    } catch (err) {
      onToast(err.response?.data?.message || err.response?.data || 'Failed to update username', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword || !passwordOtp) {
      onToast('Please fill in all password fields', 'error');
      return;
    }
    if (newPassword.length < 6) {
      onToast('Password must be at least 6 characters long', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onToast('Passwords do not match', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await api.put('/users/profile/update-password', {
        password: newPassword,
        otp: passwordOtp.trim()
      });
      onToast('Password updated successfully! Please use your new password next time you login.', 'success');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOtp('');
      setIsPasswordOtpSent(false);
    } catch (err) {
      onToast(err.response?.data?.message || err.response?.data || 'Failed to update password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <div className="empty-state">Loading user profile...</div>;

  return (
    <div className="reports-layout" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title text-gradient">Account Profile Settings</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage your personal profile information, username settings, and account passwords.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginTop: '20px' }} className="history-grid-layout">
        {/* User Card */}
        <div className="glass-panel" style={{ padding: '24px', height: 'fit-content', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-primary-glow)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', color: 'var(--color-primary)' }}>
            <User size={36} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</h3>
          <p style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>
            {user.role}
          </p>
          
          <div style={{ marginTop: '25px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '15px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Username</label>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>@{user.username || 'not_set'}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Email Address</label>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', wordBreak: 'break-all' }}>{user.email}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Joined On</label>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Credentials Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Change Username Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 600 }}>
              <UserCheck size={18} style={{ color: 'var(--color-primary)' }} />
              Change Username
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px', marginBottom: '20px' }}>
              Modify your unique portal username. This update requires email OTP authentication.
            </p>

            {!isUsernameOtpSent ? (
              <button
                type="button"
                className="btn-add"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => handleRequestOtp('username')}
                disabled={isLoading}
              >
                <Mail size={16} /> Request OTP Code to Change Username
              </button>
            ) : (
              <form onSubmit={handleUpdateUsername} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Verification OTP Code (check your email)</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP code"
                    value={usernameOtp}
                    onChange={(e) => setUsernameOtp(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Username</label>
                  <input
                    type="text"
                    placeholder="new_username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                  {newUsername.trim().length >= 3 && (
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

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, marginTop: 0 }} disabled={isLoading || (newUsername.trim().length >= 3 && !usernameAvailable)}>
                    Confirm Username Change
                  </button>
                  <button type="button" className="btn-secondary" style={{ width: 'auto' }} onClick={() => setIsUsernameOtpSent(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Change Password Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 600 }}>
              <Key size={18} style={{ color: 'var(--color-secondary)' }} />
              Change Password
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px', marginBottom: '20px' }}>
              Update your account login security password. This update requires email OTP authentication.
            </p>

            {!isPasswordOtpSent ? (
              <button
                type="button"
                className="btn-add"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => handleRequestOtp('password')}
                disabled={isLoading}
              >
                <Mail size={16} /> Request OTP Code to Change Password
              </button>
            ) : (
              <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Verification OTP Code (check your email)</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP code"
                    value={passwordOtp}
                    onChange={(e) => setPasswordOtp(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password (min 6 chars)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ paddingRight: '40px', width: '100%' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
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
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ paddingRight: '40px', width: '100%' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, marginTop: 0 }} disabled={isLoading}>
                    Confirm Password Change
                  </button>
                  <button type="button" className="btn-secondary" style={{ width: 'auto' }} onClick={() => setIsPasswordOtpSent(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
