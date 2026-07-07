import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Eye, Trash2, Calendar, Clock, BookOpen, AlertCircle, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Reports.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportHistory = ({ onToast, onEditDraft }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good morning';
    if (hrs < 17) return 'Good afternoon';
    return 'Good evening';
  };

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

  useEffect(() => {
    if (selectedReport) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedReport]);

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

  const handleDownloadReport = (report) => {
    // 1. Create a styled container in DOM to render our premium card
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px'; // off screen
    element.style.width = '800px';
    element.style.background = '#ffffff';
    element.style.color = '#1f2937';
    element.style.fontFamily = 'Outfit, sans-serif';
    element.style.padding = '40px';
    element.style.lineHeight = '1.6';

    const completedTasks = parseJsonList(report.tasksCompleted);
    const plannedTasks = parseJsonList(report.tasksPlanned);
    const blockersList = parseJsonList(report.blockers);
    const hasBlockers = blockersList.some(b => b.toLowerCase() !== 'none');
    
    const completedHtml = completedTasks.map(t => `<li style="margin-bottom: 8px; font-size: 0.95rem; color: #334155;">${t}</li>`).join('');
    const plannedHtml = plannedTasks.map(p => `<li style="margin-bottom: 8px; font-size: 0.95rem; color: #334155;">${p}</li>`).join('');
    const blockersHtml = blockersList.map(b => `<li style="margin-bottom: 8px; font-size: 0.95rem; color: #334155;">${b}</li>`).join('');
    
    // Fallback names if report.user is empty/missing
    const userName = report.user?.name || 'Team Member';
    const userEmail = report.user?.email || '';

    element.innerHTML = `
      <div style="border: 2px solid #0f172a; padding: 40px; background: #ffffff;">
        <div style="border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase;">SISENCO DIGITAL</div>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 4px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Enterprise Work Management Portal</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.15rem; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Weekly Status Report</div>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">Date Generated: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px; font-size: 0.9rem; color: #334155;">
          <div><span style="color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; display: block; margin-bottom: 2px;">Team Member</span><strong style="color: #0f172a; font-size: 0.95rem;">${userName}</strong> ${userEmail ? `<span style="color: #64748b; font-size: 0.85rem;">(${userEmail})</span>` : ''}</div>
          <div><span style="color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; display: block; margin-bottom: 2px;">Reporting Period</span><strong style="color: #0f172a; font-size: 0.95rem;">Week of ${report.weekStart}</strong></div>
          <div><span style="color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; display: block; margin-bottom: 2px;">Project Category</span><strong style="color: #0f172a; font-size: 0.95rem;">${report.project.name}</strong></div>
          <div><span style="color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; display: block; margin-bottom: 2px;">Effort Logged</span><strong style="color: #0f172a; font-size: 0.95rem;">${report.hoursWorked ? `${report.hoursWorked} hours` : 'N/A'}</strong></div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">1. Tasks Completed</h3>
          <ul style="padding-left: 18px; margin: 0; color: #334155; line-height: 1.6;">${completedHtml}</ul>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">2. Tasks Planned for Next Week</h3>
          <ul style="padding-left: 18px; margin: 0; color: #334155; line-height: 1.6;">${plannedHtml}</ul>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">3. Blockers & Challenges</h3>
          <ul style="padding-left: 18px; margin: 0; color: #334155; line-height: 1.6;">${blockersHtml}</ul>
        </div>

        ${report.notes ? `
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">4. Additional Notes</h3>
          <div style="background: #f8fafc; border-radius: 6px; padding: 15px; font-size: 0.9rem; white-space: pre-wrap; border: 1px solid #e2e8f0; color: #334155; line-height: 1.5;">${report.notes}</div>
        </div>
        ` : ''}

        <div style="margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 0.85rem; color: #475569;">
          <div>
            <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 40px; text-align: center;">
              <strong>Team Member Signature</strong>
            </div>
          </div>
          <div>
            <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 40px; text-align: center;">
              <strong>Reviewer / Manager Signature</strong>
            </div>
          </div>
        </div>

        <div style="margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 0.75rem; color: #94a3b8; line-height: 1.4;">
          CONFIDENTIAL — INTERNAL USE ONLY<br>
          This document is generated by the Sisenco Digital Weekly Work Planner. All data is stored securely.<br>
          Sisenco Digital portal © 2026. All Rights Reserved.
        </div>
      </div>
    `;

    document.body.appendChild(element);

    onToast('Generating PDF, please wait...', 'info');

    setTimeout(() => {
      html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4'
        });
        
        const imgWidth = 210; // A4 width
        const pageHeight = 297; // A4 height
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const fileName = `Weekly_Report_${userName.replace(/\s+/g, '_')}_${report.weekStart}.pdf`;
        pdf.save(fileName);
        document.body.removeChild(element);
        onToast('Report downloaded successfully as PDF!', 'success');
      }).catch((err) => {
        console.error(err);
        document.body.removeChild(element);
        onToast('Failed to generate PDF file', 'error');
      });
    }, 200);
  };

  return (
    <div className="reports-layout" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
            {getGreeting()}, {user?.name || 'Member'} !
          </span>
          <h2 className="page-title text-gradient">Report History Logs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Review your previously submitted weekly logs and saved drafts.
          </p>
        </div>
      </div>

      <div className="history-card glass-panel" style={{ marginTop: '20px', padding: '30px' }}>
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
                  <button 
                    type="button" 
                    className="btn-add" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--color-primary)', color: '#ffffff' }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditDraft(report.weekStart);
                    }}
                  >
                    Edit
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
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <span className="text-gradient" style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={22} style={{ color: 'var(--color-primary)' }} />
                  Week of {selectedReport.weekStart}
                </span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
                  My Report Details
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', marginRight: '16px' }}>
                <span className={`badge badge-${selectedReport.status.toLowerCase()}`}>
                  {selectedReport.status}
                </span>
                {selectedReport.status === 'SUBMITTED' && (
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleDownloadReport(selectedReport)}
                  >
                    <Download size={14} /> Download PDF
                  </button>
                )}
              </div>
              <button className="modal-close" onClick={() => setSelectedReport(null)}>&times;</button>
            </div>

            {/* General Metadata Info Grid */}
            <div className="details-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(27, 168, 131, 0.03)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>Project Category</div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{selectedReport.project.name}</strong>
              </div>
              <div style={{ background: 'rgba(27, 168, 131, 0.03)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>Hours Logged</div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{selectedReport.hoursWorked ? `${selectedReport.hoursWorked} hrs` : '—'}</strong>
              </div>
              {selectedReport.submittedAt && (
                <div style={{ background: 'rgba(27, 168, 131, 0.03)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>Submitted Time</div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{new Date(selectedReport.submittedAt).toLocaleDateString()}</strong>
                </div>
              )}
            </div>

            {/* Tasks Completed Section */}
            <div className="details-section" style={{ background: 'rgba(255, 255, 255, 0.4)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '50%', fontSize: '0.8rem' }}>✓</span>
                Tasks Completed This Week
              </h4>
              <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
                {parseJsonList(selectedReport.tasksCompleted).map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                    <span style={{ color: 'var(--color-success)', marginTop: '4px' }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tasks Planned Section */}
            <div className="details-section" style={{ background: 'rgba(255, 255, 255, 0.4)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', background: 'rgba(8, 145, 178, 0.1)', color: 'var(--color-accent)', borderRadius: '50%', fontSize: '0.8rem' }}>➔</span>
                Tasks Planned For Next Week
              </h4>
              <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
                {parseJsonList(selectedReport.tasksPlanned).map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                    <span style={{ color: 'var(--color-accent)', marginTop: '4px' }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Blockers Section */}
            <div className="details-section" style={{ background: 'rgba(255, 255, 255, 0.4)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: parseJsonList(selectedReport.blockers).some(b => b.toLowerCase() !== 'none') ? 'var(--color-danger)' : 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', background: parseJsonList(selectedReport.blockers).some(b => b.toLowerCase() !== 'none') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)', color: parseJsonList(selectedReport.blockers).some(b => b.toLowerCase() !== 'none') ? 'var(--color-danger)' : 'var(--text-muted)', borderRadius: '50%', fontSize: '0.8rem' }}>!</span>
                Blockers & Challenges
              </h4>
              <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
                {parseJsonList(selectedReport.blockers).map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px', fontSize: '0.95rem', color: item.toLowerCase() !== 'none' ? 'var(--color-danger)' : 'var(--text-primary)', fontWeight: item.toLowerCase() !== 'none' ? 500 : 'normal', lineHeight: '1.5' }}>
                    <span style={{ color: item.toLowerCase() !== 'none' ? 'var(--color-danger)' : 'var(--text-muted)', marginTop: '4px' }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Manager Suggestions */}
            {selectedReport.blockerSuggestions && (
              <div className="details-section" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(20, 143, 110, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: 'var(--color-success)', borderBottom: '1px solid rgba(16, 185, 129, 0.15)', paddingBottom: '10px', marginBottom: '12px' }}>
                  <BookOpen size={16} style={{ color: 'var(--color-success)' }} />
                  Manager's Suggestions / Solutions
                </h4>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: 'var(--color-secondary)', lineHeight: '1.6', fontWeight: 500, margin: 0 }}>
                  {selectedReport.blockerSuggestions}
                </p>
              </div>
            )}

            {/* Additional Notes */}
            {selectedReport.notes && (
              <div className="details-section" style={{ background: 'rgba(255, 255, 255, 0.4)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '12px' }}>
                  <BookOpen size={16} style={{ color: 'var(--color-primary)' }} />
                  Additional Notes
                </h4>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>{selectedReport.notes}</p>
              </div>
            )}

            {(selectedReport.status === 'DRAFT' || selectedReport.status === 'SUBMITTED') && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: 'auto', padding: '10px 20px', marginTop: 0 }}
                  onClick={() => {
                    setSelectedReport(null);
                    onEditDraft(selectedReport.weekStart);
                  }}
                >
                  Edit & Re-Submit Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportHistory;
