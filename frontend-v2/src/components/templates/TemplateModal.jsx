import React, { useState, useEffect } from 'react';
import { createTemplate, updateTemplate } from '../../services/templates';

const CATEGORIES = [
  { value: 'match_reminder', label: '⚽ Match Reminder' },
  { value: 'fixtures_update', label: '📅 Fixtures Update' },
  { value: 'membership', label: '🎫 Membership' },
  { value: 'match_result', label: '🏆 Match Result' },
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'merch', label: '🛍️ Merch' },
  { value: 'general', label: '📬 General' },
];

const TIERS = [
  { value: 'all', label: 'All Members' },
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'bronze', label: 'Bronze' },
];

export default function TemplateModal({ isOpen, onClose, onSave, template }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tier, setTier] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name || '');
      setCategory(template.category || 'general');
      setSubject(template.subject || '');
      setMessage(template.message || '');
      setTier(template.tier || 'all');
    } else {
      setName('');
      setCategory('general');
      setSubject('');
      setMessage('');
      setTier('all');
    }
  }, [template]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = { name, category, subject, message, tier };

    try {
      if (template) {
        await updateTemplate(template.id, data);
      } else {
        await createTemplate(data);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{template ? 'Edit Template' : 'New Template'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Template Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Match Reminder"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Target Tier</label>
              <select value={tier} onChange={(e) => setTier(e.target.value)}>
                {TIERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Subject (Optional)</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., ⚽️ Match Day Alert!"
            />
          </div>

          <div className="form-group">
            <label>Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your template message here... Use {opponent}, {date}, {time}, {venue} as placeholders"
              rows={6}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}