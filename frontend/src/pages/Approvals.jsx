import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { UserCheck, UserX, RefreshCw } from 'lucide-react';
import '../styles/Reports.css';

const Approvals = ({ onToast }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/registrations');
      setRegistrations(res.data);
    } catch (err) {
      onToast('Failed to load pending registrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleApprove = async (id, name) => {
    try {
      onToast(`Approving ${name}...`, 'info');
      await api.put(`/admin/registrations/${id}/approve`);
      onToast(`Account for ${name} approved successfully! Notification email sent.`, 'success');
      fetchRegistrations();
    } catch (err) {
      onToast(err.response?.data || 'Failed to approve account', 'error');
    }
  };

  const handleDecline = async (id, name) => {
    if (!window.confirm(`Are you sure you want to decline and delete the registration request from ${name}?`)) {
      return;
    }
    try {
      await api.delete(`/admin/registrations/${id}/decline`);
      onToast(`Registration for ${name} declined.`, 'success');
      fetchRegistrations();
    } catch (err) {
      onToast(err.response?.data || 'Failed to decline registration', 'error');
    }
  };

  return (
    <div className="reports-layout" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title text-gradient">Pending Registration Requests</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Review, accept, or decline pending account registrations for your team.
          </p>
        </div>
        <button 
          type="button" 
          className="btn-add" 
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          onClick={fetchRegistrations}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="history-card glass-panel" style={{ marginTop: '20px', padding: '30px' }}>
        {loading ? (
          <div className="empty-state">Retrieving pending registrations...</div>
        ) : registrations.length === 0 ? (
          <div className="empty-state">No pending registrations requests.</div>
        ) : (
          <div className="compliance-table-wrapper">
            <table className="compliance-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Email Address</th>
                  <th>Requested Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{reg.name}</strong>
                    </td>
                    <td><code>{reg.username}</code></td>
                    <td>{reg.email}</td>
                    <td>
                      <span className={`badge badge-${reg.role.toLowerCase() === 'manager' ? 'submitted' : 'draft'}`}>
                        {reg.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          type="button"
                          className="btn-add"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--color-primary)', color: '#ffffff' }}
                          onClick={() => handleApprove(reg.id, reg.name)}
                        >
                          <UserCheck size={14} /> Accept
                        </button>
                        <button
                          type="button"
                          className="btn-remove"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleDecline(reg.id, reg.name)}
                        >
                          <UserX size={14} /> Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;
