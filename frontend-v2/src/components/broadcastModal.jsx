// src/components/BroadcastModal.jsx
// Standalone modal — does not modify main.jsx or styles.css
// Props: isOpen, onClose, onSend, tierCounts, preSelectedTier

import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TEMPLATES = {
  'Match alert':        (tier) => `⚽ Match Day Alert!\n\nMugutha FC take to the pitch this weekend.\nKick-off: 3:00 PM at Mugutha Grounds.\n\nCome out and support the boys! 💙`,
  'Lineup update':      (tier) => `📋 Today's Starting XI\n\nHere's your exclusive lineup update ahead of today's match.\n\nMore than Football. 💙`,
  'Renewal reminder':   (tier) => `⚠️ Membership Renewal\n\nYour Mugutha FC membership is due for renewal soon.\n\nRenew today to keep enjoying exclusive member benefits!`,
  'Sponsor update':     (tier) => `📊 Club Update\n\nExciting news from Mugutha FC leadership.\nPlease reply to this message for more details.`,
  'Merch drop':         (tier) => `🛍️ New Merch Available!\n\nMugutha FC premium merchandise is now available.\nReply ORDER to reserve yours before the public sale!`,
  'Custom message':     ()     => '',
};

const TIER_LABELS = {
  all:    'All Members',
  gold:   'Gold Tier',
  silver: 'Silver Tier',
  bronze: 'Bronze Tier',
};

const TIER_COLORS = {
  all:    '#1a4d2e',
  gold:   '#c8972a',
  silver: '#888780',
  bronze: '#d85a30',
};

export default function BroadcastModal({ isOpen, onClose, onSend, tierCounts = {}, preSelectedTier = 'all' }) {
  const [tier, setTier]           = useState(preSelectedTier);
  const [msgType, setMsgType]     = useState('Match alert');
  const [message, setMessage]     = useState(TEMPLATES['Match alert']('all'));
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState(null); // { sent, failed } or null

  // Sync tier when modal opens with a preSelectedTier
  useEffect(() => {
    if (isOpen) {
      setTier(preSelectedTier);
      setResult(null);
      setSending(false);
    }
  }, [isOpen, preSelectedTier]);

  // Update message when type changes
  const handleTypeChange = (type) => {
    setMsgType(type);
    if (type !== 'Custom message') {
      setMessage(TEMPLATES[type](tier));
    } else {
      setMessage('');
    }
  };

  const recipientCount = tier === 'all'
    ? (tierCounts.total || 0)
    : (tierCounts[tier] || 0);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/broadcasts/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: msgType,
          message: message.trim(),
          tier: tier === 'all' ? undefined : tier,
          send_now: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ sent: data.sent || recipientCount, failed: data.failed || 0 });
        onSend?.(data);
        setTimeout(() => { onClose(); setResult(null); }, 2200);
      } else {
        setResult({ error: data.error || 'Send failed' });
      }
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Send broadcast">

        <div className="modal-header">
          <h3>Send Broadcast</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Tier selector */}
        <div className="modal-section">
          <label className="modal-label">Audience</label>
          <div className="tier-selector">
            {Object.entries(TIER_LABELS).map(([key, label]) => {
              const count = key === 'all' ? (tierCounts.total || 0) : (tierCounts[key] || 0);
              return (
                <button
                  key={key}
                  className={`tier-btn ${tier === key ? 'active' : ''}`}
                  onClick={() => setTier(key)}
                >
                  {label}
                  <span className="tier-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message type */}
        <div className="modal-section">
          <label className="modal-label" htmlFor="msg-type">Message type</label>
          <select
            id="msg-type"
            className="modal-select"
            value={msgType}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            {Object.keys(TEMPLATES).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Message body */}
        <div className="modal-section">
          <label className="modal-label" htmlFor="msg-body">Message</label>
          <textarea
            id="msg-body"
            className="modal-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Write your message here…"
          />
          <div className="char-count">{message.length} characters</div>
        </div>

        {/* Result feedback */}
        {result && (
          <div className={`modal-result ${result.error ? 'error' : 'success'}`}>
            {result.error
              ? `❌ Error: ${result.error}`
              : `✅ Sent to ${result.sent} member${result.sent !== 1 ? 's' : ''}${result.failed ? ` (${result.failed} failed)` : ''}`
            }
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button
            className="modal-send"
            onClick={handleSend}
            disabled={sending || !message.trim() || recipientCount === 0}
            style={{ background: TIER_COLORS[tier] }}
          >
            {sending
              ? 'Sending…'
              : `Send to ${recipientCount} ${tier === 'all' ? '' : TIER_LABELS[tier] + ' '}member${recipientCount !== 1 ? 's' : ''}`
            }
          </button>
        </div>

      </div>
    </div>
  );
}