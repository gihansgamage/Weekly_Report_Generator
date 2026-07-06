import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Users, CheckCircle2, AlertOctagon, RefreshCw, 
  BarChart4, CalendarDays, Briefcase, Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, LineChart, Line, Cell
} from 'recharts';
import '../styles/Dashboard.css';
import '../styles/Reports.css';

const Dashboard = ({ onToast }) => {
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday.toISOString().split('T')[0];
  };

  const [selectedWeek, setSelectedWeek] = useState(getMonday(new Date()));
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/stats', { params: { week: selectedWeek } });
      setStats(res.data);
    } catch (err) {
      onToast('Failed to load dashboard metrics', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedWeek]);

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

      {loadingStats ? (
        <div className="empty-state">Loading dashboard summaries...</div>
      ) : (
        <>
          {/* Metrics Banner */}
          <div className="metrics-grid">
            <div className="metric-card glass-panel animate-fade-in">
              <div className="metric-info">
                <h3>Total Members</h3>
                <div className="metric-value">{stats?.totalMembers}</div>
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
                <h3>Submitted Reports</h3>
                <div className="metric-value">
                  {stats?.submittedCount}
                </div>
              </div>
              <div className="metric-icon purple">
                <CalendarDays size={24} />
              </div>
            </div>

            <div className="metric-card glass-panel animate-fade-in">
              <div className="metric-info">
                <h3>Pending Reports</h3>
                <div className="metric-value">
                  {stats?.pendingCount}
                </div>
              </div>
              <div className="metric-icon yellow">
                <Clock size={24} />
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
          <div className="charts-grid" style={{ marginTop: '30px' }}>
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
        </>
      )}
    </div>
  );
};

export default Dashboard;
