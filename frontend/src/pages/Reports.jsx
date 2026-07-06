import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Trash2, Calendar, FileText, Lock, Save, Send } from 'lucide-react';
import '../styles/Reports.css';

const Reports = ({ onToast }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  
  // Format weekStart (defaulting to the Monday of the current week)
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday.toISOString().split('T')[0];
  };

  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [hoursWorked, setHoursWorked] = useState('');
  const [notes, setNotes] = useState('');
  
  // Dynamic List Builders
  const [tasksCompleted, setTasksCompleted] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  
  const [tasksPlanned, setTasksPlanned] = useState([]);
  const [planInput, setPlanInput] = useState('');
  
  const [blockers, setBlockers] = useState([]);
  const [blockerInput, setBlockerInput] = useState('');

  // Mode Tracking
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [userReports, setUserReports] = useState([]);

  // Fetch projects list
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data);
        if (res.data.length > 0) {
          setSelectedProject(res.data[0].id);
        }
      } catch (err) {
        onToast('Failed to load project categories', 'error');
      }
    };
    fetchProjects();
  }, []);

  // Fetch own reports history to check duplicate / draft for weekStart
  const fetchOwnHistory = async () => {
    try {
      const res = await api.get('/reports/history');
      setUserReports(res.data);
      checkExistingReport(res.data, weekStart);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOwnHistory();
  }, [weekStart]);

  const checkExistingReport = (reports, targetWeek) => {
    const existing = reports.find(r => r.weekStart === targetWeek);
    if (existing) {
      setIsEditMode(true);
      setEditingReportId(existing.id);
      setSelectedProject(existing.project.id);
      setHoursWorked(existing.hoursWorked || '');
      setNotes(existing.notes || '');
      
      // Parse JSON inputs
      try {
        setTasksCompleted(JSON.parse(existing.tasksCompleted));
      } catch (e) {
        setTasksCompleted(existing.tasksCompleted.split(';'));
      }
      try {
        setTasksPlanned(JSON.parse(existing.tasksPlanned));
      } catch (e) {
        setTasksPlanned(existing.tasksPlanned.split(';'));
      }
      try {
        setBlockers(JSON.parse(existing.blockers));
      } catch (e) {
        setBlockers(existing.blockers.split(';'));
      }

      if (existing.status === 'SUBMITTED') {
        setIsLocked(true);
        onToast(`Report for the week of ${targetWeek} is submitted and locked.`, 'info');
      } else {
        setIsLocked(false);
        onToast(`Loaded draft report for the week of ${targetWeek}.`, 'info');
      }
    } else {
      // Reset form for fresh creation
      setIsEditMode(false);
      setEditingReportId(null);
      setHoursWorked('');
      setNotes('');
      setTasksCompleted([]);
      setTasksPlanned([]);
      setBlockers([]);
      setIsLocked(false);
    }
  };

  const handleDateChange = (e) => {
    const normalizedMonday = getMonday(e.target.value);
    setWeekStart(normalizedMonday);
  };

  // Add Item Helpers
  const addCompletedTask = (e) => {
    e.preventDefault();
    if (taskInput.trim()) {
      setTasksCompleted([...tasksCompleted, taskInput.trim()]);
      setTaskInput('');
    }
  };

  const addPlannedTask = (e) => {
    e.preventDefault();
    if (planInput.trim()) {
      setTasksPlanned([...tasksPlanned, planInput.trim()]);
      setPlanInput('');
    }
  };

  const addBlocker = (e) => {
    e.preventDefault();
    if (blockerInput.trim()) {
      setBlockers([...blockers, blockerInput.trim()]);
      setBlockerInput('');
    }
  };

  // Submit/Save Action
  const handleSubmitReport = async (status) => {
    if (!selectedProject) {
      onToast('Please select a project category', 'error');
      return;
    }
    if (tasksCompleted.length === 0) {
      onToast('Please add at least one completed task', 'error');
      return;
    }
    if (tasksPlanned.length === 0) {
      onToast('Please add at least one planned task for next week', 'error');
      return;
    }
    // Set blockers to ["None"] if empty to satisfy non-blank constraint
    const finalBlockers = blockers.length > 0 ? blockers : ["None"];

    const payload = {
      projectId: parseInt(selectedProject),
      weekStart: weekStart,
      tasksCompleted: JSON.stringify(tasksCompleted),
      tasksPlanned: JSON.stringify(tasksPlanned),
      blockers: JSON.stringify(finalBlockers),
      hoursWorked: hoursWorked ? parseInt(hoursWorked) : null,
      notes: notes,
      status: status
    };

    try {
      if (isEditMode) {
        await api.put(`/reports/${editingReportId}`, payload);
      } else {
        await api.post('/reports', payload);
      }
      onToast(status === 'SUBMITTED' ? 'Report submitted successfully!' : 'Draft saved successfully!', 'success');
      fetchOwnHistory();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || 'Failed to save report';
      onToast(typeof errMsg === 'string' ? errMsg : 'Operation failed', 'error');
    }
  };

  return (
    <div className="reports-layout">
      <div className="page-header">
        <div>
          <h2 className="page-title text-gradient">Weekly Report Entry</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Submit structured details for each billing week.
          </p>
        </div>
        {isLocked && (
          <span className="badge badge-submitted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={12} />
            Submitted & Locked
          </span>
        )}
      </div>

      <div className="report-form glass-panel">
        <div className="form-grid">
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
              Reporting Week Start (Monday)
            </label>
            <input 
              type="date" 
              value={weekStart} 
              onChange={handleDateChange}
              disabled={isLocked}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} style={{ color: 'var(--color-primary)' }} />
              Project / Category Tag
            </label>
            <select 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={isLocked}
            >
              {projects.length === 0 && <option value="">No projects available</option>}
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* List Builder: Tasks Completed */}
          <div className="form-group form-field-full">
            <label style={{ fontWeight: 600 }}>Tasks Completed This Week <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            {!isLocked && (
              <div className="list-input-group">
                <input 
                  type="text" 
                  placeholder="Describe a task completed (e.g. Fixed navigation drawer bug)"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                />
                <button type="button" className="btn-add" onClick={addCompletedTask}>
                  <Plus size={16} /> Add
                </button>
              </div>
            )}
            <div className="list-items">
              {tasksCompleted.map((t, idx) => (
                <div key={idx} className="list-item">
                  <span>{t}</span>
                  {!isLocked && (
                    <button type="button" className="btn-remove" onClick={() => setTasksCompleted(tasksCompleted.filter((_, i) => i !== idx))}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {tasksCompleted.length === 0 && <div className="empty-state">No completed tasks added yet.</div>}
            </div>
          </div>

          {/* List Builder: Tasks Planned */}
          <div className="form-group form-field-full">
            <label style={{ fontWeight: 600 }}>Tasks Planned For Next Week <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            {!isLocked && (
              <div className="list-input-group">
                <input 
                  type="text" 
                  placeholder="Describe a task planned (e.g. Integrate PostgreSQL database)"
                  value={planInput}
                  onChange={(e) => setPlanInput(e.target.value)}
                />
                <button type="button" className="btn-add" onClick={addPlannedTask}>
                  <Plus size={16} /> Add
                </button>
              </div>
            )}
            <div className="list-items">
              {tasksPlanned.map((p, idx) => (
                <div key={idx} className="list-item">
                  <span>{p}</span>
                  {!isLocked && (
                    <button type="button" className="btn-remove" onClick={() => setTasksPlanned(tasksPlanned.filter((_, i) => i !== idx))}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {tasksPlanned.length === 0 && <div className="empty-state">No planned tasks added yet.</div>}
            </div>
          </div>

          {/* List Builder: Blockers */}
          <div className="form-group form-field-full">
            <label style={{ fontWeight: 600 }}>Blockers / Challenges</label>
            {!isLocked && (
              <div className="list-input-group">
                <input 
                  type="text" 
                  placeholder="Describe blockers, or leave empty if none (e.g. Delayed API deployment)"
                  value={blockerInput}
                  onChange={(e) => setBlockerInput(e.target.value)}
                />
                <button type="button" className="btn-add" onClick={addBlocker}>
                  <Plus size={16} /> Add
                </button>
              </div>
            )}
            <div className="list-items">
              {blockers.map((b, idx) => (
                <div key={idx} className="list-item">
                  <span>{b}</span>
                  {!isLocked && (
                    <button type="button" className="btn-remove" onClick={() => setBlockers(blockers.filter((_, i) => i !== idx))}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {blockers.length === 0 && <div className="empty-state">No blockers reported (Everything is running fine).</div>}
            </div>
          </div>

          <div className="form-group">
            <label>Hours Worked (Optional)</label>
            <input 
              type="number" 
              placeholder="e.g. 40" 
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)}
              disabled={isLocked}
              min="0"
              max="168"
            />
          </div>

          <div className="form-group form-field-full">
            <label>Optional Notes or Links</label>
            <textarea 
              rows="3" 
              placeholder="Add links to documentation, Jira tickets, or extra remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLocked}
            />
          </div>
        </div>

        {!isLocked && (
          <div className="form-actions">
            <button type="button" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleSubmitReport('DRAFT')}>
              <Save size={16} />
              Save Draft
            </button>
            <button type="button" className="btn-primary" style={{ width: 'auto', padding: '12px 28px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleSubmitReport('SUBMITTED')}>
              <Send size={16} />
              Submit Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
