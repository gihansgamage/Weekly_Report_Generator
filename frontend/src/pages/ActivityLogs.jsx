import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Clock, RefreshCw, FileClock, ClipboardList } from 'lucide-react';
import '../styles/Dashboard.css';

const ActivityLogs = ({ onToast }) => {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/activity');
      setActivity(res.data);
    } catch (err) {
      if (onToast) {
        onToast('Failed to load team activity logs', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  return (
    <div className="reports-layout" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title text-gradient">Team Activity Logs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Real-time feed of weekly report submissions and edits across all team members.
          </p>
        </div>
        <button 
          type="button" 
          className="btn-add" 
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          onClick={fetchActivity}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh Feed
        </button>
      </div>

      <div className="glass-panel" style={{ marginTop: '25px', padding: '30px' }}>
        <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', marginBottom: '20px' }}>
          <FileClock size={20} style={{ color: 'var(--color-primary)' }} />
          Recent Activity Feed
        </h3>

        <div className="activity-feed-full">
          {loading ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>Syncing team updates...</div>
          ) : activity.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>No report activity logged yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {activity.map((act) => (
                <div 
                  key={act.id} 
                  className="activity-item" 
                  style={{ 
                    background: '#ffffff', 
                    border: '1px solid var(--border-glass)', 
                    borderRadius: '12px', 
                    padding: '16px 20px', 
                    fontSize: '0.9rem', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.015)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: 'rgba(27, 168, 131, 0.1)', 
                      color: 'var(--color-primary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <ClipboardList size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {act.details ? (
                        act.details
                      ) : (
                        <>
                          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{act.userName}</span> submitted weekly report for <span style={{ fontWeight: 600 }}>{act.projectName}</span>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {act.weekStart && (
                        <>
                          <span>Week Starting: <strong>{act.weekStart}</strong></span>
                          <span>•</span>
                        </>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {new Date(act.timestamp || act.submittedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
