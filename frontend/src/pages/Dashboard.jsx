import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Users, CheckCircle2, AlertOctagon, Filter, Eye, RefreshCw, 
  BarChart4, CalendarDays, Briefcase, FileClock, X, Clock, BookOpen
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import '../styles/Dashboard.css';
import '../styles/Reports.css';

const Dashboard = ({ onToast }) => {
  // Filters State
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday.toISOString().split('T')[0];
  };

  const [selectedWeek, setSelectedWeek] = useState(getMonday(new Date()));
  const [filterUser, setFilterUser] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Dropdown lists
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);

  // Stats & Reports data
  const [stats, setStats] = useState(null);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Fetch initial dropdown metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const projRes = await api.get('/projects');
        setProjects(projRes.data);
        
        const meRes = await api.get('/auth/me'); // To ensure token works
        // Get all members by querying stats endpoint mapping
        // We will load user list dynamically from the stats endpoint or me metadata
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/stats', { params: { week: selectedWeek } });
      setStats(res.data);
      
      // Map members list from stats to populate user filter dropdown
      if (res.data.memberSubmissionStatus) {
        const uList = res.data.memberSubmissionStatus.map(m => ({ id: m.userId, name: m.name }));
        setMembers(uList);
      }
    } catch (err) {
      onToast('Failed to load dashboard metrics', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Reports list based on active filters
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
      console.error(err);
      onToast('Failed to load filtered reports log', 'error');
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedWeek]);

  useEffect(() => {
    fetchFilteredReports();
  }, [filterUser, filterProject, filterStartDate, filterEndDate]);

  // Normalise status badges helper for compliance grid
  const resolveStatusBadge = (status, weekStartVal) => {
    const currentMonday = getMonday(new Date());
    if (status === 'PENDING') {
      if (weekStartVal < currentMonday) {
        return <span className="badge badge-late">LATE</span>;
      }
      return <span className="badge badge-pending">PENDING</span>;
    }
    return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
  };

  // Helper to open report detail view by loading matching details
  const viewReportDetails = async (reportId) => {
    try {
      const res = await api.get('/reports'); // Managers can read all reports
      const matching = res.data.find(r => r.id === reportId);
      if (matching) {
        setSelectedReport(matching);
      }
    } catch (err) {
      onToast('Failed to load report contents', 'error');
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

  // Charts data configurations
  const COLORS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#06b6d4', '#ef4444'];
  const projectChartData = stats?.projectDistribution?.map(p => ({
    name: p.name,
    value: p.totalHours || p.reportCount || 0
  })) || [];

  const trendChartData = stats?.tasksCompletedTrend?.map(t => ({
    week: t.weekStart,
    tasks: t.tasksCompleted
  })) || [];

  return (
    <div className="dashboard-layout animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title text-gradient font-sans">Team Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Consolidated weekly compliance reviews, blockers, and project activity insights.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <CalendarDays size={18} style={{ color: 'var(--color-primary)' }} />
          <select 
            value={selectedWeek} 
            onChange={(e) => setSelectedWeek(getMonday(e.target.value))}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            {/* Generate past 4 weeks dropdown selector dynamically */}
            {Array.from({ length: 6 }).map((_, idx) => {
              const monday = getMonday(new Date(Date.now() - idx * 7 * 24 * 60 * 60 * 1000));
              return <option key={monday} value={monday}>Week of {monday}</option>;
            })}
          </select>
          <button className="btn-add" style={{ padding: '8px 12px' }} onClick={fetchStats} title="Refresh Dashboard">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {loadingStats ? (
        <div className="empty-state">Loading dashboard summaries...</div>
      ) : (
        <>
          <div className="metrics-grid">
            <div className="metric-card glass-panel animate-fade-in">
              <div className="metric-info">
                <h3>Submitted Reports</h3>
                <div className="metric-value">
                  {stats?.submittedCount} / {stats?.totalMembers}
                </div>
              </div>
              <div className="metric-icon blue">
                <Users size={24} />
              </div>
            </div>

            <div className="metric-card glass-panel animate-fade-in">
              <div className="metric-info">
                <h3>Compliance Rate</h3>
                <div className="metric-value">{stats?.complianceRate}%</div>
              </div>
              <div className="metric-icon green">
                <CheckCircle2 size={24} />
              </div>
            </div>

            <div className="metric-card glass-panel animate-fade-in">
              <div className="metric-info">
                <h3>Active Blockers</h3>
                <div className="metric-value" style={{ color: stats?.openBlockersCount > 0 ? 'var(--color-danger)' : 'inherit' }}>
                  {stats?.openBlockersCount}
                </div>
              </div>
              <div className="metric-icon red">
                <AlertOctagon size={24} />
              </div>
            </div>
          </div>

          {/* Visual Insights Charts Grid */}
          <div className="charts-grid">
            {/* Chart: Completed Tasks Trend over time */}
            <div className="chart-card glass-panel">
              <div className="chart-header">
                <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart4 size={18} style={{ color: 'var(--color-primary)' }} />
                  Tasks Completed Trend (Last 4 Weeks)
                </h3>
              </div>
              <div className="chart-wrapper">
                {trendChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={trendChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="week" stroke="var(--text-secondary)" fontSize={11} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}
                        labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                      />
                      <Line type="monotone" dataKey="tasks" stroke="var(--color-primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">No trend statistics logged.</div>
                )}
              </div>
            </div>

            {/* Chart: Project work distribution */}
            <div className="chart-card glass-panel">
              <div className="chart-header">
                <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={18} style={{ color: 'var(--color-secondary)' }} />
                  Workload Distribution by Project (Hours)
                </h3>
              </div>
              <div className="chart-wrapper">
                {projectChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={projectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}
                      />
                      <Bar dataKey="value" fill="var(--color-secondary)" radius={[4, 4, 0, 0]}>
                        {projectChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">No project logs available this week.</div>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-sections">
            {/* Compliance Table Grid */}
            <div className="compliance-card glass-panel">
              <h3 className="chart-title" style={{ fontSize: '1.1rem' }}>Team Compliance Status</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                Submission tracker for the week starting {selectedWeek}.
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
                    {stats?.memberSubmissionStatus?.map((m) => (
                      <tr key={m.userId}>
                        <td>
                          <div className="compliance-user">{m.name}</div>
                          <div className="compliance-email">{m.email}</div>
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
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              <Eye size={14} /> View Report
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="activity-card glass-panel">
              <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem' }}>
                <FileClock size={18} style={{ color: 'var(--color-accent)' }} />
                Recent Activity Logs
              </h3>
              <div className="activity-feed">
                {stats?.recentActivity?.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px 0' }}>No recent submissions.</div>
                ) : (
                  stats?.recentActivity?.map((act) => (
                    <div key={act.id} className="activity-item">
                      <div className="activity-meta">
                        <div className="activity-title">
                          <strong>{act.userName}</strong> submitted weekly report for <strong>{act.projectName}</strong>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          Week of {act.weekStart}
                        </div>
                        <div className="activity-time">
                          {new Date(act.submittedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reports Filtering section */}
      <div className="glass-panel filters-bar" style={{ marginTop: '40px' }}>
        <h3 className="chart-title" style={{ width: '100%', marginBottom: '10px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={16} /> Filter Team Reports Logs
        </h3>
        
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

        {(filterUser || filterProject || filterStartDate || filterEndDate) && (
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ padding: '8px 16px', fontSize: '0.8rem', height: 'fit-content', marginTop: '20px' }}
            onClick={() => {
              setFilterUser('');
              setFilterProject('');
              setFilterStartDate('');
              setFilterEndDate('');
            }}
          >
            Clear Filters
          </button>
        )}

        <div className="compliance-table-wrapper" style={{ marginTop: '20px' }}>
          {loadingReports ? (
            <div className="empty-state">Filtering reports logs...</div>
          ) : filteredReports.length === 0 ? (
            <div className="empty-state">No matching reports found in database.</div>
          ) : (
            <table className="compliance-table">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Member</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(rep => (
                  <tr key={rep.id}>
                    <td>Week of {rep.weekStart}</td>
                    <td><strong>{rep.user.name}</strong></td>
                    <td>{rep.project.name}</td>
                    <td>
                      <span className={`badge badge-${rep.status.toLowerCase()}`}>{rep.status}</span>
                    </td>
                    <td>
                      <button 
                        type="button" 
                        className="btn-details" 
                        onClick={() => setSelectedReport(rep)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Eye size={14} /> Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Dialog Details overlay */}
      {selectedReport && (
        <div className="report-details-overlay" onClick={() => setSelectedReport(null)}>
          <div className="report-details-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Report Contents</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                  Author: <strong>{selectedReport.user.name}</strong> ({selectedReport.user.email}) | Week: {selectedReport.weekStart}
                </p>
              </div>
              <button className="modal-close" onClick={() => setSelectedReport(null)}>&times;</button>
            </div>

            <div className="details-section">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} style={{ color: 'var(--color-primary)' }} />
                General Metrics
              </h4>
              <p>Project Associated: <strong>{selectedReport.project.name}</strong></p>
              {selectedReport.hoursWorked && <p>Hours Logged: <strong>{selectedReport.hoursWorked} hrs</strong></p>}
              {selectedReport.submittedAt && (
                <p>Submitted On: <strong>{new Date(selectedReport.submittedAt).toLocaleString()}</strong></p>
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
              <h4>Tasks Planned</h4>
              <ul>
                {parseJsonList(selectedReport.tasksPlanned).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="details-section">
              <h4 style={{ color: parseJsonList(selectedReport.blockers).some(b => b.toLowerCase() !== 'none') ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                Blockers / Obstacles
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

export default Dashboard;
