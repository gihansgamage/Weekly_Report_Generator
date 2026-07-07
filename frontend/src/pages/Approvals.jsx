import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { UserCheck, UserX, RefreshCw } from 'lucide-react';
import '../styles/Reports.css';

const Approvals = ({ onToast }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'approve' | 'decline', id: number, name: string }

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

  useEffect(() => {
    if (confirmAction) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [confirmAction]);

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
                  <th>Email Address</th>
                  <th>Requested Role</th>
                  <th>Request Date & Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{reg.name}</strong>
                    </td>
                    <td>{reg.email}</td>
                    <td>
                      <span className={`badge badge-${reg.role.toLowerCase() === 'manager' ? 'submitted' : 'draft'}`}>
                        {reg.role}
                      </span>
                    </td>
                    <td>{reg.createdAt ? new Date(reg.createdAt).toLocaleString() : 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          type="button"
                          className="btn-add"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--color-primary)', color: '#ffffff' }}
                          onClick={() => setConfirmAction({ type: 'approve', id: reg.id, name: reg.name })}
                        >
                          <UserCheck size={14} /> Accept
                        </button>
                        <button
                          type="button"
                          className="btn-remove"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setConfirmAction({ type: 'decline', id: reg.id, name: reg.name })}
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

      {/* Action Confirmation Popup Modal */}
      {confirmAction && (
        <div className="report-details-overlay" onClick={() => setConfirmAction(null)}>
          <div className="report-details-modal glass-panel animate-fade-in" style={{ maxWidth: '450px', padding: '30px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                background: confirmAction.type === 'approve' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                color: confirmAction.type === 'approve' ? 'var(--color-success)' : 'var(--color-danger)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                {confirmAction.type === 'approve' ? <UserCheck size={26} /> : <UserX size={26} />}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {confirmAction.type === 'approve' ? 'Approve Registration?' : 'Decline Registration?'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                {confirmAction.type === 'approve' 
                  ? `Are you sure you want to approve the registration request for ${confirmAction.name}? They will receive an email and be able to log in.`
                  : `Are you sure you want to decline and delete the registration request from ${confirmAction.name}? This cannot be undone.`}
              </p>
              <div style={{ display: 'flex', width: '100%', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                  onClick={() => setConfirmAction(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ 
                    flex: 1, 
                    padding: '10px', 
                    background: confirmAction.type === 'approve' ? 'var(--color-primary)' : 'var(--color-danger)', 
                    borderColor: confirmAction.type === 'approve' ? 'var(--color-primary)' : 'var(--color-danger)', 
                    marginTop: 0 
                  }}
                  onClick={async () => {
                    const { type, id, name } = confirmAction;
                    setConfirmAction(null);
                    if (type === 'approve') {
                      try {
                        onToast(`Approving ${name}...`, 'info');
                        await api.put(`/admin/registrations/${id}/approve`);
                        onToast(`Account for ${name} approved successfully! Notification email sent.`, 'success');
                        fetchRegistrations();
                      } catch (err) {
                        onToast(err.response?.data || 'Failed to approve account', 'error');
                      }
                    } else {
                      try {
                        await api.delete(`/admin/registrations/${id}/decline`);
                        onToast(`Registration for ${name} declined.`, 'success');
                        fetchRegistrations();
                      } catch (err) {
                        onToast(err.response?.data || 'Failed to decline registration', 'error');
                      }
                    }
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
