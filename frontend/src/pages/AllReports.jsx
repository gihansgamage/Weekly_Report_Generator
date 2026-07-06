import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Eye, RefreshCw, CalendarDays, Download, X, Clock, BookOpen, Filter
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/Dashboard.css';
import '../styles/Reports.css';

const AllReports = ({ onToast }) => {
  // Filtering states
  const [filterUser, setFilterUser] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filteredReports, setFilteredReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Metadata dropdowns
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);

  // Report Modal view
  const [selectedReport, setSelectedReport] = useState(null);

  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday.toISOString().split('T')[0];
  };

  const fetchMetadata = async () => {
    try {
      const projRes = await api.get('/projects');
      setProjects(projRes.data);
      
      const statsRes = await api.get('/stats');
      if (statsRes.data.memberSubmissionStatus) {
        const uList = statsRes.data.memberSubmissionStatus.map(m => ({ id: m.userId, name: m.name }));
        setMembers(uList);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFilteredReports = async () => {
    setLoadingReports(true);
    const params = {};
    if (filterUser) params.userId = filterUser;
    if (filterProject) params.projectId = filterProject;
    if (filterStartDate) params.startDate = getMonday(filterStartDate);
    if (filterEndDate) params.endDate = getMonday(filterEndDate);
    
    try {
      const res = await api.get('/reports', { params });
      setFilteredReports(res.data);
    } catch (err) {
      onToast('Failed to load reports log', 'error');
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchFilteredReports();
  }, []);

  useEffect(() => {
    fetchFilteredReports();
  }, [filterUser, filterProject, filterStartDate, filterEndDate]);

  const parseJsonList = (jsonStr) => {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return jsonStr.split(';').filter(x => x.trim() !== '');
    }
  };

  // View report details and trigger mark-as-read
  const viewReportDetails = async (report) => {
    setSelectedReport(report);
    if (!report.readByManager && report.status === 'SUBMITTED') {
      try {
        await api.put(`/reports/${report.id}/read`);
        // Update item readByManager flag locally to clear unread indicator
        setFilteredReports(prev => prev.map(r => r.id === report.id ? { ...r, readByManager: true } : r));
      } catch (err) {
        console.error('Failed to mark report as read:', err);
      }
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title text-gradient">All Reports Database</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Filter, search, and audit all historical work reports across the entire team database.
          </p>
        </div>
        <button 
          type="button" 
          className="btn-add" 
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          onClick={fetchFilteredReports}
        >
          <RefreshCw size={14} />
          Refresh List
        </button>
      </div>

      {/* Reports Filtering section */}
      <div className="glass-panel filters-bar" style={{ marginTop: '25px', padding: '30px' }}>
        <h3 className="chart-title" style={{ width: '100%', marginBottom: '15px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
          <Filter size={18} style={{ color: 'var(--color-primary)' }} /> Search & Filter Parameters
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', width: '100%' }}>
          <div className="filter-group">
            <label>Team Member</label>
            <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
              <option value="">All Members</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Project</label>
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input 
              type="date" 
              value={filterStartDate} 
              onChange={(e) => setFilterStartDate(e.target.value)} 
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input 
              type="date" 
              value={filterEndDate} 
              onChange={(e) => setFilterEndDate(e.target.value)} 
            />
          </div>
        </div>

        {/* Filtered Logs List */}
        <div style={{ width: '100%', marginTop: '25px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>Filtered Results</h4>
          {loadingReports ? (
            <div className="empty-state">Searching logs...</div>
          ) : filteredReports.length === 0 ? (
            <div className="empty-state">No matching reports found.</div>
          ) : (
            <div className="compliance-table-wrapper">
              <table className="compliance-table">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Team Member</th>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((rep) => (
                    <tr key={rep.id}>
                      <td>Week of {rep.weekStart}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {!rep.readByManager && rep.status === 'SUBMITTED' && (
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
                          <strong>{rep.user.name}</strong>
                        </div>
                      </td>
                      <td>{rep.project.name}</td>
                      <td>
                        <span className={`badge badge-${rep.status.toLowerCase()}`}>{rep.status}</span>
                      </td>
                      <td>
                        <button 
                          type="button" 
                          className="btn-details" 
                          onClick={() => viewReportDetails(rep)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600 }}
                        >
                          <Eye size={14} /> Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reports View Details Overlay */}
      {selectedReport && (
        <div className="report-details-overlay" onClick={() => setSelectedReport(null)}>
          <div className="report-details-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Weekly Report Details</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                  Submitted by {selectedReport.user.name} for week starting {selectedReport.weekStart}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto', marginRight: '16px' }}>
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

            <div className="details-section">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} style={{ color: 'var(--color-primary)' }} />
                General Information
              </h4>
              <p>Team Member: <strong>{selectedReport.user.name} ({selectedReport.user.email})</strong></p>
              <p>Project / Category: <strong>{selectedReport.project.name}</strong></p>
              {selectedReport.hoursWorked && <p>Hours Logged: <strong>{selectedReport.hoursWorked} hrs</strong></p>}
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

export default AllReports;
