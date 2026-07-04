import React, { useState, useEffect } from 'react';

export default function BroadcastModal({
  isOpen,
  onClose,
  onSend,
  tierCounts = { total: 0, gold: 0, silver: 0, bronze: 0 },
  preSelectedTier = 'all'
}) {
  const [selectedTier, setSelectedTier] = useState(preSelectedTier || 'all');
  const [messageType, setMessageType] = useState('Match alert');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSummary, setSentSummary] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedTier(preSelectedTier || 'all');
      setMessageType('Match alert');
      setBody('');
      setSentSummary(null);
    }
  }, [isOpen, preSelectedTier]);

  if (!isOpen) return null;

  const counts = {
    all: tierCounts.total || 0,
    gold: tierCounts.gold || 0,
    silver: tierCounts.silver || 0,
    bronze: tierCounts.bronze || 0
  };

  const messageOptions = [
    'Match alert',
    'Lineup update',
    'Renewal reminder',
    'Sponsor update',
    'Merch drop',
    'Custom message'
  ];

  const charCount = body.length;

  async function handleSend() {
    setSending(true);
    setSentSummary(null);
    try {
      const payload = {
        title: messageType,
        message: body || messageType,
        tier: selectedTier,
        send_now: true
      };

      const res = await fetch('/api/broadcasts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));

      const membersSent = data.membersSent ?? data.recipients ?? (data.results && data.results.sent) ?? 0;
      setSentSummary({ membersSent, results: data.results || {} });
      if (onSend) onSend(data);
      // brief success then close
      setTimeout(() => {
        setSending(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Broadcast send failed', err);
      setSentSummary({ error: err.message || 'Send failed' });
      setSending(false);
    }
  }

  return (
    <div style={styles.backdrop}>
      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Send Broadcast</h3>

        <div style={styles.row}>
          <div style={styles.tierGroup}>
            <button style={selectedTier === 'all' ? styles.tierActive : styles.tier} onClick={() => setSelectedTier('all')}>
              All Members ({counts.all})
            </button>
            <button style={selectedTier === 'gold' ? styles.tierActive : styles.tier} onClick={() => setSelectedTier('gold')}>
              Gold ({counts.gold})
            </button>
            <button style={selectedTier === 'silver' ? styles.tierActive : styles.tier} onClick={() => setSelectedTier('silver')}>
              Silver ({counts.silver})
            </button>
            <button style={selectedTier === 'bronze' ? styles.tierActive : styles.tier} onClick={() => setSelectedTier('bronze')}>
              Bronze ({counts.bronze})
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={styles.label}>Message type</label>
          <select value={messageType} onChange={e => setMessageType(e.target.value)} style={styles.select}>
            {messageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={styles.label}>Message</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your message here..."
            rows={5}
            style={styles.textarea}
          />
          <div style={styles.charCount}>{charCount} chars</div>
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancel} disabled={sending}>Cancel</button>
          <button onClick={handleSend} style={styles.send} disabled={sending}>
            {sending ? 'Sending…' : `Send to ${counts[selectedTier] || 0} ${selectedTier === 'all' ? 'members' : selectedTier + ' members'}`}
          </button>
        </div>

        {sentSummary && (
          <div style={styles.summary}>
            {sentSummary.error ? (
              <div style={{ color: 'crimson' }}>Error: {sentSummary.error}</div>
            ) : (
              <div style={{ color: 'green' }}>Sent to {sentSummary.membersSent} members</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
  },
  card: {
    width: 520, background: '#fff', borderRadius: 10, padding: 18, boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
  },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  tierGroup: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  tier: { padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' },
  tierActive: { padding: '8px 10px', borderRadius: 6, border: '1px solid #2b6cb0', background: '#e6f0ff', cursor: 'pointer' },
  label: { display: 'block', fontSize: 13, marginBottom: 6, color: '#333' },
  select: { width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' },
  textarea: { width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', resize: 'vertical' },
  charCount: { textAlign: 'right', fontSize: 12, color: '#666', marginTop: 6 },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  cancel: { padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' },
  send: { padding: '8px 14px', borderRadius: 6, border: 'none', background: '#2b6cb0', color: '#fff', cursor: 'pointer' },
  summary: { marginTop: 12, fontSize: 13 }
};
