import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Eye, RefreshCw, CalendarDays, Download, X, Clock, BookOpen, Calendar
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/Dashboard.css';
import '../styles/Reports.css';

const Submissions = ({ onToast }) => {
  const getMonday = (d) => {
    let date;
    if (typeof d === 'string') {
      const [year, month, day] = d.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else if (d instanceof Date) {
      date = new Date(d);
    } else {
      date = new Date();
    }
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0,0,0,0);
    const yyyy = monday.getFullYear();
    const mm = String(monday.getMonth() + 1).padStart(2, '0');
    const dd = String(monday.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(getMonday(new Date()));
  const [selectedReport, setSelectedReport] = useState(null);
  const [suggestionsText, setSuggestionsText] = useState('');
  const [savingSuggestions, setSavingSuggestions] = useState(false);

  useEffect(() => {
    if (selectedReport) {
      setSuggestionsText(selectedReport.blockerSuggestions || '');
    } else {
      setSuggestionsText('');
    }
  }, [selectedReport]);

  const handleSaveSuggestions = async () => {
    if (!selectedReport) return;
    setSavingSuggestions(true);
    try {
      const res = await api.put(`/reports/${selectedReport.id}/suggestions`, {
        suggestions: suggestionsText
      });
      onToast('Suggestions saved and notification email sent to user!', 'success');
      setSelectedReport(res.data);
      fetchStats();
    } catch (err) {
      onToast(err.response?.data || 'Failed to save suggestions', 'error');
    } finally {
      setSavingSuggestions(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stats?week=${selectedWeek}`);
      setStats(res.data);
    } catch (err) {
      onToast('Failed to load submissions statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedWeek]);

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

  const handleWeekChange = (e) => {
    setLoading(true);
    setSelectedWeek(getMonday(e.target.value));
  };

  const parseJsonList = (jsonStr) => {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return jsonStr.split(';').filter(x => x.trim() !== '');
    }
  };

  const resolveStatusBadge = (status, weekStr) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="badge badge-submitted">Submitted</span>;
      case 'DRAFT':
        return <span className="badge badge-draft">Draft</span>;
      case 'PENDING':
        return <span className="badge badge-pending">Pending</span>;
      default:
        return <span className="badge badge-pending">Pending</span>;
    }
  };

  const viewReportDetails = async (id, mObj = null) => {
    try {
      const allRes = await api.get(`/reports`);
      const rep = allRes.data.find(r => r.id === id);
      
      if (rep) {
        setSelectedReport(rep);
        // Mark as read in backend
        if (!rep.readByManager) {
          await api.put(`/reports/${rep.id}/read`);
          window.dispatchEvent(new Event('reportRead'));
          fetchStats();
        }
      } else {
        onToast('Report data not found', 'error');
      }
    } catch (err) {
      console.error('Failed to view report or mark as read:', err);
    }
  };

  const handleDownloadReport = (report) => {
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px';
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
    
    const completedHtml = completedTasks.map(t => `<li style="margin-bottom: 8px; font-size: 0.95rem;">${t}</li>`).join('');
    const plannedHtml = plannedTasks.map(p => `<li style="margin-bottom: 8px; font-size: 0.95rem;">${p}</li>`).join('');
    const blockersHtml = blockersList.map(b => `<li class="${b.toLowerCase() !== 'none' ? 'blocker-warn' : ''}" style="margin-bottom: 8px; font-size: 0.95rem; ${b.toLowerCase() !== 'none' ? 'color: #dc2626; font-weight: 500;' : ''}">${b}</li>`).join('');
    
    element.innerHTML = `
      <div style="border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px; background: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1ba883; padding-bottom: 20px; margin-bottom: 30px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.8rem; font-weight: 700; color: #1ba883;">Sisenco Digital</span>
          </div>
          <span style="background: rgba(27, 168, 131, 0.1); color: #1ba883; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Weekly Status Report</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 30px; font-size: 0.95rem;">
          <div><strong>Team Member:</strong> ${report.user.name} (${report.user.email})</div>
          <div><strong>Reporting Week:</strong> Week starting ${report.weekStart}</div>
          <div><strong>Project / Category:</strong> ${report.project.name}</div>
          <div><strong>Hours Logged:</strong> ${report.hoursWorked ? `${report.hoursWorked} hrs` : '—'}</div>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 1.1rem; font-weight: 600; color: #111827; border-left: 4px solid #1ba883; padding-left: 10px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Tasks Completed This Week</h3>
          <ul style="padding-left: 20px;">${completedHtml}</ul>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 1.1rem; font-weight: 600; color: #111827; border-left: 4px solid #1ba883; padding-left: 10px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Planned Tasks For Next Week</h3>
          <ul style="padding-left: 20px;">${plannedHtml}</ul>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 1.1rem; font-weight: 600; color: #111827; border-left: 4px solid ${hasBlockers ? '#dc2626' : '#1ba883'}; padding-left: 10px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Blockers & Challenges</h3>
          <ul style="padding-left: 20px;">${blockersHtml}</ul>
        </div>

        ${report.notes ? `
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 1.1rem; font-weight: 600; color: #111827; border-left: 4px solid #1ba883; padding-left: 10px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Additional Notes</h3>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; font-size: 0.95rem; white-space: pre-wrap; border: 1px solid #e5e7eb;">${report.notes}</div>
        </div>
        ` : ''}

        <div style="margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; font-size: 0.8rem; color: #9ca3af;">
          This report is a system-generated document from Sisenco Digital Weekly Work Planner.<br>
          Generated on: ${new Date().toLocaleString()}
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
        
        const imgWidth = 210;
        const pageHeight = 297;
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

        const fileName = `Weekly_Report_${report.user.name.replace(/\s+/g, '_')}_${report.weekStart}.pdf`;
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
      {/* Upper Title */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title text-gradient">Team Submissions</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Check team report submission compliance and view details of weekly logs.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid var(--border-glass)', padding: '6px 12px', borderRadius: '8px' }}>
            <CalendarDays size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>Select Week:</span>
            <input 
              type="date" 
              value={selectedWeek} 
              onChange={handleWeekChange}
              style={{ border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}
            />
          </div>
          <button 
            type="button" 
            className="btn-add" 
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            onClick={fetchStats}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {stats && (
        <div className="glass-panel" style={{ marginTop: '25px', padding: '30px' }}>
          <h3 className="chart-title" style={{ fontSize: '1.2rem', fontWeight: 600 }}>Team Compliance Tracker</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', marginBottom: '20px' }}>
            Detailed logs of weekly statuses for the week starting {selectedWeek}.
          </p>
          
          <div className="compliance-table-wrapper">
            <table className="compliance-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Submission Status</th>
                  <th>Submission Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.memberSubmissionStatus?.map((m) => {
                  // If reportId is set and matching status list from stats has submittedAt, let's see if it's unread
                  // Unread submissions are marked in the stats data from backend if we extend it, or we can check the database!
                  // Wait, can we pass a list of reports or just rely on if it's unread?
                  // Wait, how did we get unread before?
                  // In the previous version we checked: `!matchingReport.readByManager`
                  // Wait! The stats endpoint response `stats.memberSubmissionStatus` list can also return `readByManager`!
                  // Let's check `StatController.java` line 112:
                  // `mStat.put("status", repOpt.get().getStatus());`
                  // If we also put `readByManager` inside `mStat` on backend:
                  // `mStat.put("readByManager", repOpt.get().isReadByManager());`
                  // This is incredibly clean and 100% correct! We should modify StatController.java to include "readByManager" inside memberSubmissionStatus list!
                  // That way Submissions.jsx doesn't need to load the entire reports list just to find the read state!
                  // Yes, let's look at that!
                  const isUnread = m.status === 'SUBMITTED' && m.readByManager === false;

                  return (
                    <tr key={m.userId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isUnread && (
                            <span 
                              style={{ 
                                width: '8px', 
                                height: '8px', 
                                background: 'var(--color-danger)', 
                                borderRadius: '50%', 
                                display: 'inline-block' 
                              }} 
                              title="Unread Submission"
                            />
                          )}
                          <div className="compliance-user">{m.name}</div>
                        </div>
                        <div className="compliance-email" style={{ paddingLeft: isUnread ? '16px' : '0' }}>{m.email}</div>
                      </td>
                      <td>
                        {resolveStatusBadge(m.status, selectedWeek)}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {m.submittedAt ? new Date(m.submittedAt).toLocaleString() : '—'}
                      </td>
                      <td>
                        {m.reportId ? (
                          <button 
                            type="button" 
                            className="btn-details"
                            onClick={() => viewReportDetails(m.reportId)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600 }}
                          >
                            <Eye size={14} /> View Report
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {stats.memberSubmissionStatus?.length === 0 && (
                  <tr>
                    <td colSpan="4" className="empty-state">No team members registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports View Details Overlay */}
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
                  Submitted by {selectedReport.user.name}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', marginRight: '16px' }}>
                <span className={`badge badge-${selectedReport.status.toLowerCase()}`}>
                  {selectedReport.status}
                </span>
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => handleDownloadReport(selectedReport)}
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>
              <button className="modal-close" onClick={() => setSelectedReport(null)}>&times;</button>
            </div>

            {/* General Metadata Info Grid */}
            <div className="details-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(27, 168, 131, 0.03)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>Team Member</div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{selectedReport.user.name} ({selectedReport.user.email})</strong>
              </div>
              <div style={{ background: 'rgba(27, 168, 131, 0.03)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>Project Category</div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{selectedReport.project.name}</strong>
              </div>
              <div style={{ background: 'rgba(27, 168, 131, 0.03)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>Hours Logged</div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{selectedReport.hoursWorked ? `${selectedReport.hoursWorked} hrs` : '—'}</strong>
              </div>
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

            {/* Suggestions Editor */}
            <div className="details-section" style={{ background: 'rgba(27, 168, 131, 0.02)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '12px' }}>
                <BookOpen size={16} style={{ color: 'var(--color-primary)' }} />
                Manager's Suggestions / Solutions for Blockers
              </h4>
              <div style={{ marginTop: '10px' }}>
                <textarea
                  rows="3"
                  placeholder="Provide suggestions or solutions for these blockers..."
                  value={suggestionsText}
                  onChange={(e) => setSuggestionsText(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical' }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveSuggestions}
                  disabled={savingSuggestions}
                  style={{ width: 'auto', padding: '10px 20px', fontSize: '0.85rem', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {savingSuggestions ? 'Saving...' : 'Save & Notify User'}
                </button>
              </div>
            </div>

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
          </div>
        </div>
      )}
    </div>
  );
};

export default Submissions;
