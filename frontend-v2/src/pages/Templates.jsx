import React, { useState } from 'react';
import useTemplates from '../hooks/useTemplates';
import TemplateList from '../components/templates/TemplateList';
import TemplateModal from '../components/templates/TemplateModal';
import { deleteTemplate } from '../services/templates';

export default function Templates() {
  const { templates, loading, refreshTemplates } = useTemplates();
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3500);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleSave = () => {
    setShowModal(false);
    refreshTemplates();
    showToast('Template saved successfully!');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this template?')) {
      const success = await deleteTemplate(id);
      if (success) {
        refreshTemplates();
        showToast('Template deleted successfully!');
      }
    }
  };

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>📝 Templates</h1>
          <p>Pre-saved message templates for quick broadcasts</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={handleCreate}>
            + New Template
          </button>
        </div>
      </header>

      <div className="panel">
        <div className="panel-head">
          <h3>All Templates</h3>
          <span className="template-count">{templates.length} templates</span>
        </div>
        <TemplateList
          templates={templates}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <TemplateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        template={editingTemplate}
      />

      {toast.message && (
        <div className={`toast ${toast.type}`} style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#b91c1c' : '#1a4d2e',
          color: '#fff', padding: '10px 20px', borderRadius: 10,
          fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 9999,
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}