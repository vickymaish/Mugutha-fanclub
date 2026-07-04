import React from 'react';
import TemplateCard from './TemplateCard';

export default function TemplateList({ templates, loading, onEdit, onDelete }) {
  if (loading) {
    return <div className="loading-state"><p>Loading templates...</p></div>;
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="empty-state">
        <p>No templates yet. Create your first template to get started!</p>
      </div>
    );
  }

  return (
    <div className="template-grid">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}