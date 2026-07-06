import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Trash2, Calendar, FileText, Lock, Save, Send } from 'lucide-react';
import '../styles/Reports.css';

const Reports = ({ onToast, editingDraftWeek, setEditingDraftWeek }) => {
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

  useEffect(() => {
    if (editingDraftWeek) {
      setWeekStart(editingDraftWeek);
      setEditingDraftWeek(null);
    }
  }, [editingDraftWeek]);
  const [hoursWorked, setHoursWorked] = useState('');
  const [notes, setNotes] = useState('');
  
  // Dynamic List Builders (inline inputs, initially containing one empty string)
  const [tasksCompleted, setTasksCompleted] = useState(['']);
  const [tasksPlanned, setTasksPlanned] = useState(['']);
  const [blockers, setBlockers] = useState(['']);

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
        const parsed = JSON.parse(existing.tasksCompleted);
        setTasksCompleted(parsed.length > 0 ? parsed : ['']);
      } catch (e) {
        const split = existing.tasksCompleted.split(';').map(s => s.trim()).filter(Boolean);
        setTasksCompleted(split.length > 0 ? split : ['']);
      }
      try {
        const parsed = JSON.parse(existing.tasksPlanned);
        setTasksPlanned(parsed.length > 0 ? parsed : ['']);
      } catch (e) {
        const split = existing.tasksPlanned.split(';').map(s => s.trim()).filter(Boolean);
        setTasksPlanned(split.length > 0 ? split : ['']);
      }
      try {
        const parsed = JSON.parse(existing.blockers);
        setBlockers(parsed.length > 0 ? parsed : ['']);
      } catch (e) {
        const split = existing.blockers.split(';').map(s => s.trim()).filter(Boolean);
        setBlockers(split.length > 0 ? split : ['']);
      }

      setIsLocked(false);
      if (existing.status === 'SUBMITTED') {
        onToast(`Loaded submitted report for the week of ${targetWeek}. You can edit and re-submit it.`, 'info');
      } else {
        onToast(`Loaded draft report for the week of ${targetWeek}.`, 'info');
      }
    } else {
      // Reset form for fresh creation
      setIsEditMode(false);
      setEditingReportId(null);
      setHoursWorked('');
      setNotes('');
      setTasksCompleted(['']);
      setTasksPlanned(['']);
      setBlockers(['']);
      setIsLocked(false);
    }
  };

  const handleDateChange = (e) => {
    const normalizedMonday = getMonday(e.target.value);
    setWeekStart(normalizedMonday);
  };

  // Submit/Save Action
  const handleSubmitReport = async (status) => {
    if (!selectedProject) {
      onToast('Please select a project category', 'error');
      return;
    }

    const activeTasks = tasksCompleted.filter(t => t.trim() !== '');
    const activePlanned = tasksPlanned.filter(p => p.trim() !== '');
    const activeBlockers = blockers.filter(b => b.trim() !== '');

    if (activeTasks.length === 0) {
      onToast('Please describe at least one completed task', 'error');
      return;
    }
    if (activePlanned.length === 0) {
      onToast('Please describe at least one planned task for next week', 'error');
      return;
    }
    
    // Set blockers to ["None"] if empty
    const finalBlockers = activeBlockers.length > 0 ? activeBlockers : ["None"];

    const payload = {
      projectId: parseInt(selectedProject),
      weekStart: weekStart,
      tasksCompleted: JSON.stringify(activeTasks),
      tasksPlanned: JSON.stringify(activePlanned),
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              {tasksCompleted.map((task, idx) => (
                <div key={idx} className="list-input-group" style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <input 
                    type="text" 
                    placeholder="Describe a task completed (e.g. Fixed navigation drawer bug)"
                    value={task}
                    onChange={(e) => {
                      const newTasks = [...tasksCompleted];
                      newTasks[idx] = e.target.value;
                      setTasksCompleted(newTasks);
                    }}
                    disabled={isLocked}
                    style={{ flex: 1 }}
                  />
                  {!isLocked && tasksCompleted.length > 1 && (
                    <button 
                      type="button" 
                      className="btn-remove" 
                      onClick={() => setTasksCompleted(tasksCompleted.filter((_, i) => i !== idx))}
                      style={{ padding: '10px 14px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              {!isLocked && (
                <button 
                  type="button" 
                  className="btn-add" 
                  onClick={() => setTasksCompleted([...tasksCompleted, ''])}
                  style={{ width: 'fit-content', padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
                >
                  <Plus size={14} /> Add Task
                </button>
              )}
            </div>
          </div>

          {/* List Builder: Tasks Planned */}
          <div className="form-group form-field-full">
            <label style={{ fontWeight: 600 }}>Tasks Planned For Next Week <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              {tasksPlanned.map((task, idx) => (
                <div key={idx} className="list-input-group" style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <input 
                    type="text" 
                    placeholder="Describe a task planned (e.g. Integrate PostgreSQL database)"
                    value={task}
                    onChange={(e) => {
                      const newPlanned = [...tasksPlanned];
                      newPlanned[idx] = e.target.value;
                      setTasksPlanned(newPlanned);
                    }}
                    disabled={isLocked}
                    style={{ flex: 1 }}
                  />
                  {!isLocked && tasksPlanned.length > 1 && (
                    <button 
                      type="button" 
                      className="btn-remove" 
                      onClick={() => setTasksPlanned(tasksPlanned.filter((_, i) => i !== idx))}
                      style={{ padding: '10px 14px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              {!isLocked && (
                <button 
                  type="button" 
                  className="btn-add" 
                  onClick={() => setTasksPlanned([...tasksPlanned, ''])}
                  style={{ width: 'fit-content', padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
                >
                  <Plus size={14} /> Add Task
                </button>
              )}
            </div>
          </div>

          {/* List Builder: Blockers */}
          <div className="form-group form-field-full">
            <label style={{ fontWeight: 600 }}>Blockers / Challenges</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              {blockers.map((blocker, idx) => (
                <div key={idx} className="list-input-group" style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <input 
                    type="text" 
                    placeholder="Describe blockers, or leave empty if none (e.g. Delayed API deployment)"
                    value={blocker}
                    onChange={(e) => {
                      const newBlockers = [...blockers];
                      newBlockers[idx] = e.target.value;
                      setBlockers(newBlockers);
                    }}
                    disabled={isLocked}
                    style={{ flex: 1 }}
                  />
                  {!isLocked && blockers.length > 1 && (
                    <button 
                      type="button" 
                      className="btn-remove" 
                      onClick={() => setBlockers(blockers.filter((_, i) => i !== idx))}
                      style={{ padding: '10px 14px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              {!isLocked && (
                <button 
                  type="button" 
                  className="btn-add" 
                  onClick={() => setBlockers([...blockers, ''])}
                  style={{ width: 'fit-content', padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
                >
                  <Plus size={14} /> Add Blocker
                </button>
              )}
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
