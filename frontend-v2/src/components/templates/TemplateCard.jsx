import React from 'react';

const CATEGORY_ICONS = {
  match_reminder: '⚽',
  fixtures_update: '📅',
  membership: '🎫',
  match_result: '🏆',
  announcement: '📢',
  merch: '🛍️',
  general: '📬',
};

const TIER_COLORS = {
  gold: 'gold',
  silver: 'silver',
  bronze: 'bronze',
  all: 'green',
};

export default function TemplateCard({ template, onEdit, onDelete }) {
  const icon = CATEGORY_ICONS[template.category] || '📝';
  const tierColor = TIER_COLORS[template.tier] || 'blue';

  return (
    <div className="template-card">
      <div className="template-header">
        <div className="template-icon">{icon}</div>
        <div className="template-info">
          <h4 className="template-name">{template.name}</h4>
          <span className="template-category">{template.category?.replace('_', ' ')}</span>
        </div>
        <span className={`tier-badge ${tierColor}`}>
          {template.tier === 'all' ? 'All Members' : template.tier}
        </span>
      </div>

      <div className="template-preview">
        <p className="template-message">
        {template.message.split('\n').map((line, i) => (
        <React.Fragment key={i}>
        {line}
        {i < template.message.split('\n').length - 1 && <br />}
        </React.Fragment>
            ))}
        </p>
        {template.subject && (
          <span className="template-subject">Subject: {template.subject}</span>
        )}
      </div>

      <div className="template-actions">
        <button className="btn-edit" onClick={() => onEdit(template)}>
          ✏️ Edit
        </button>
        <button className="btn-delete" onClick={() => onDelete(template.id)}>
          🗑️
        </button>
      </div>
    </div>
  );
}