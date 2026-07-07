import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Edit2, Trash2, FolderPlus, FolderKanban } from 'lucide-react';
import '../styles/Reports.css';

const Projects = ({ onToast }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deleteCandidateId, setDeleteCandidateId] = useState(null);

  useEffect(() => {
    if (deleteCandidateId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [deleteCandidateId]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      onToast('Failed to load project categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      onToast('Project category name cannot be empty', 'error');
      return;
    }

    const payload = { name: name.trim(), description: description.trim() };
    try {
      if (isEditing) {
        await api.put(`/projects/${currentId}`, payload);
        onToast('Project category updated successfully', 'success');
      } else {
        await api.post('/projects', payload);
        onToast('Project category created successfully', 'success');
      }
      setName('');
      setDescription('');
      setIsEditing(false);
      setCurrentId(null);
      fetchProjects();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || 'Failed to save project';
      onToast(typeof errMsg === 'string' ? errMsg : 'Operation failed', 'error');
    }
  };

  const handleEditClick = (project) => {
    setIsEditing(true);
    setCurrentId(project.id);
    setName(project.name);
    setDescription(project.description || '');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setDescription('');
  };

  // Deletion handled inline within custom confirm popup

  return (
    <div className="reports-layout">
      <div className="page-header">
        <div>
          <h2 className="page-title text-gradient">Manage Project Categories</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Add, update, or remove work categories that team members assign to their weekly logs.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Editor Form */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '1.1rem' }}>
            <FolderPlus size={18} style={{ color: 'var(--color-primary)' }} />
            <span>{isEditing ? 'Edit Category' : 'Create Category'}</span>
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Category Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input 
                type="text" 
                placeholder="e.g. Client A, Internal R&D"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Description (Optional)</label>
              <textarea 
                rows="4" 
                placeholder="Provide a brief explanation of the work category scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {isEditing && (
                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '10px' }} onClick={handleCancel}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn-primary" style={{ flex: 2, padding: '10px', marginTop: 0 }}>
                {isEditing ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '1.1rem' }}>
            <FolderKanban size={18} style={{ color: 'var(--color-primary)' }} />
            <span>Available Categories</span>
          </h3>

          {loading ? (
            <div className="empty-state">Loading categories...</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">No projects logged yet. Add one on the left.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {projects.map((project) => (
                <div key={project.id} className="list-item" style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{project.name}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {project.description || 'No description provided.'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginLeft: '16px' }}>
                    <button type="button" className="btn-remove" style={{ color: 'var(--color-primary)' }} onClick={() => handleEditClick(project)}>
                      <Edit2 size={14} />
                    </button>
                    <button type="button" className="btn-remove" onClick={() => setDeleteCandidateId(project.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Delete Confirmation Popup Modal */}
      {deleteCandidateId && (
        <div className="report-details-overlay" onClick={() => setDeleteCandidateId(null)}>
          <div className="report-details-modal glass-panel animate-fade-in" style={{ maxWidth: '450px', padding: '30px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Delete Category?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                Are you sure you want to delete this project category? This action is permanent and will delete all associated weekly logs submitted by team members.
              </p>
              <div style={{ display: 'flex', width: '100%', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                  onClick={() => setDeleteCandidateId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px', background: 'var(--color-danger)', borderColor: 'var(--color-danger)', marginTop: 0 }}
                  onClick={async () => {
                    const id = deleteCandidateId;
                    setDeleteCandidateId(null);
                    try {
                      await api.delete(`/projects/${id}`);
                      onToast('Project category deleted successfully', 'success');
                      fetchProjects();
                    } catch (err) {
                      const errMsg = err.response?.data?.message || err.response?.data || 'Failed to delete project';
                      onToast(typeof errMsg === 'string' ? errMsg : 'Operation failed', 'error');
                    }
                  }}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
