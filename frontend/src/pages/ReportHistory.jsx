import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Eye, Trash2, Calendar, Clock, BookOpen, AlertCircle } from 'lucide-react';
import '../styles/Reports.css';

const ReportHistory = ({ onToast }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/history');
      setHistory(res.data);
    } catch (err) {
      onToast('Failed to load report history logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this report draft?')) return;
    try {
      await api.delete(`/reports/${id}`);
      onToast('Report deleted successfully', 'success');
      fetchHistory();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || 'Failed to delete report';
      onToast(typeof errMsg === 'string' ? errMsg : 'Operation failed', 'error');
    }
  };

  const parseJsonList = (jsonStr) => {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return jsonStr.split(';').filter(x => x.trim() !== '');
    }
  };

  return (
    <div className="reports-layout">
      <div className="page-header">
        <div>
          <h2 className="page-title text-gradient">Report History Logs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Review your previously submitted weekly logs and saved drafts.
          </p>
        </div>
      </div>

      <div className="history-card glass-panel">
        {loading ? (
          <div className="empty-state">Loading history logs...</div>
        ) : history.length === 0 ? (
          <div className="empty-state">No reports submitted or drafted yet.</div>
        ) : (
          <div className="history-list">
            {history.map((report) => (
              <div 
                key={report.id} 
                className="history-item" 
                onClick={() => setSelectedReport(report)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                    <span>Week of {report.weekStart}</span>
                    <span className={`badge badge-${report.status.toLowerCase()}`}>
                      {report.status}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Project: <strong style={{ color: 'var(--text-primary)' }}>{report.project.name}</strong>
                    {report.hoursWorked && ` | Hours: ${report.hoursWorked} hrs`}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button type="button" className="btn-add" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setSelectedReport(report)}>
                    <Eye size={14} /> View
                  </button>
                  {report.status === 'DRAFT' && (
                    <button 
                      type="button" 
                      className="btn-remove" 
                      onClick={(e) => handleDelete(report.id, e)}
                      title="Delete Draft"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Dialog Details overlay */}
      {selectedReport && (
        <div className="report-details-overlay" onClick={() => setSelectedReport(null)}>
          <div className="report-details-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Report Details</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                  Week Starting {selectedReport.weekStart} | Status: {selectedReport.status}
                </p>
              </div>
              <button className="modal-close" onClick={() => setSelectedReport(null)}>&times;</button>
            </div>

            <div className="details-section">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} style={{ color: 'var(--color-primary)' }} />
                General Information
              </h4>
              <p>Project Category: <strong>{selectedReport.project.name}</strong></p>
              {selectedReport.hoursWorked && <p>Hours Worked: <strong>{selectedReport.hoursWorked} hrs</strong></p>}
              {selectedReport.submittedAt && (
                <p>Submitted At: <strong>{new Date(selectedReport.submittedAt).toLocaleString()}</strong></p>
              )}
            </div>

            <div className="details-section">
              <h4>Tasks Completed</h4>
              <ul>
                {parseJsonList(selectedReport.tasksCompleted).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="details-section">
              <h4>Tasks Planned (Next Week)</h4>
              <ul>
                {parseJsonList(selectedReport.tasksPlanned).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="details-section">
              <h4 style={{ color: parseJsonList(selectedReport.blockers).some(b => b.toLowerCase() !== 'none') ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                Blockers / Challenges
              </h4>
              <ul>
                {parseJsonList(selectedReport.blockers).map((item, idx) => (
                  <li key={idx} style={{ color: item.toLowerCase() !== 'none' ? 'var(--color-danger)' : 'inherit' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {selectedReport.notes && (
              <div className="details-section">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={14} style={{ color: 'var(--color-primary)' }} />
                  Additional Notes
                </h4>
                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedReport.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportHistory;
