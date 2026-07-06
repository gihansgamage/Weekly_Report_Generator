import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { User, Shield, ShieldCheck, Mail, Key, UserCheck, RefreshCw, Eye, EyeOff, Save, X, Edit3 } from 'lucide-react';
import '../styles/Reports.css';

const Profile = ({ onToast }) => {
  const { user } = useAuth();
  
  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStep, setEditStep] = useState('otp'); // 'otp' | 'edit'
  
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize username fields
  useEffect(() => {
    if (user) {
      setNewUsername(user.username || '');
    }
  }, [user]);

  // Live check username availability (only if it differs from current username)
  useEffect(() => {
    if (!user || newUsername.trim() === user.username || newUsername.trim().length < 3) {
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
  }, [newUsername, user]);

  const handleStartEditing = async () => {
    setIsLoading(true);
    try {
      await api.post('/users/profile/request-otp');
      onToast('Verification OTP code sent to your email successfully!', 'success');
      setEditStep('otp');
      setIsModalOpen(true);
    } catch (err) {
      onToast('Failed to send verification OTP code. Make sure SMTP is configured.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerificationSubmit = (e) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      onToast('Please enter a valid 6-digit verification code', 'error');
      return;
    }
    // Proceed to Step 2
    setEditStep('edit');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      onToast('Please enter the verification OTP code', 'error');
      return;
    }

    const payload = { otp: otpCode.trim() };
    let hasChanges = false;

    // Validate and append username change
    if (newUsername.trim() && newUsername.trim().toLowerCase() !== user.username) {
      if (newUsername.trim().length < 3) {
        onToast('Username must be at least 3 characters', 'error');
        return;
      }
      if (usernameAvailable === false) {
        onToast('Username is already taken!', 'error');
        return;
      }
      payload.username = newUsername.trim().toLowerCase();
      hasChanges = true;
    }

    // Validate and append password change
    if (newPassword) {
      if (newPassword.length < 6) {
        onToast('New password must be at least 6 characters long', 'error');
        return;
      }
      if (newPassword !== confirmPassword) {
        onToast('Passwords do not match', 'error');
        return;
      }
      payload.password = newPassword;
      hasChanges = true;
    }

    if (!hasChanges) {
      onToast('No changes were made to your username or password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await api.put('/users/profile/update', payload);
      onToast('Profile updated successfully! Please re-login if you modified your username.', 'success');
      
      // Close Modal and Reset States
      handleCloseModal();
      
      // Auto reload window if username changed to force re-login session clean
      if (payload.username) {
        setTimeout(() => {
          localStorage.clear();
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      onToast(err.response?.data?.message || err.response?.data || 'Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewUsername(user?.username || '');
    setNewPassword('');
    setConfirmPassword('');
    setOtpCode('');
  };

  if (!user) return <div className="empty-state">Loading user profile...</div>;

  const isUsernameChanged = newUsername.trim().toLowerCase() !== user.username;

  return (
    <div className="reports-layout" style={{ maxWidth: '500px', margin: '20px auto' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '25px' }}>
        <div>
          <h2 className="page-title text-gradient">Account Settings</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage your personal profile information. Click the edit icon to configure credentials.
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', position: 'relative' }}>
        {/* Edit pen button positioned in the top-right corner */}
        <button
          type="button"
          onClick={handleStartEditing}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderRadius: '50%',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-primary-glow)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Edit Profile Settings"
          disabled={isLoading}
        >
          <Edit3 size={18} />
        </button>

        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-primary-glow)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', color: 'var(--color-primary)' }}>
          <User size={36} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</h3>
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
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Account Approval Status</label>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={16} /> Verified Active
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Edit Modal Window */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Shield size={18} style={{ color: 'var(--color-primary)' }} />
                {editStep === 'otp' ? 'Verification OTP Required' : 'Edit Profile Credentials'}
              </h3>
              <button 
                type="button" 
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            {editStep === 'otp' ? (
              <form onSubmit={handleOtpVerificationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  We have dispatched a 6-digit One-Time Password (OTP) to your registered email <strong>{user.email}</strong>. 
                  Please enter it below to verify your identity.
                </p>
                <div className="form-group">
                  <label>Verification OTP Code</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, marginTop: 0 }}>
                    Verify & Unlock Editing
                  </button>
                  <button type="button" className="btn-secondary" style={{ width: 'auto' }} onClick={handleCloseModal}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                  {isUsernameChanged && newUsername.trim().length >= 3 && (
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
                  <label>New Password (leave blank to keep current)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ paddingRight: '40px', width: '100%' }}
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

                {newPassword && (
                  <div className="form-group animate-fade-in">
                    <label>Confirm New Password</label>
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
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ flex: 1, marginTop: 0 }} 
                    disabled={isLoading || (isUsernameChanged && newUsername.trim().length >= 3 && !usernameAvailable)}
                  >
                    <Save size={16} /> Save Profile Changes
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ width: 'auto' }} 
                    onClick={handleCloseModal}
                  >
                    <X size={16} /> Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
