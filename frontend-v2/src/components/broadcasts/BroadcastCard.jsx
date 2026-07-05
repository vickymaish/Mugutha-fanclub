import React from 'react';

const TIER_COLORS = {
  gold: 'gold',
  silver: 'silver',
  bronze: 'bronze',
  all: 'green',
};

export default function BroadcastCard({ broadcast }) {
  const tierColor = TIER_COLORS[broadcast.tier] || 'blue';
  
  const sentDate = broadcast.sent_at
    ? new Date(broadcast.sent_at).toLocaleDateString('en-KE', {
        day: 'numeric', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit'
      })
    : broadcast.scheduled_for 
      ? `Scheduled: ${new Date(broadcast.scheduled_for).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
      : 'Draft';

  const statusColor = broadcast.status === 'sent' ? 'delivered' : 
                      broadcast.status === 'scheduled' ? 'pending' : 
                      broadcast.status === 'failed' ? 'pending' : '';

  // Format message with actual newlines
  const formattedMessage = broadcast.message?.replace(/\\n/g, '\n') || '';

  return (
    <div className="broadcast-card">
      <div className="broadcast-header">
        <div className="broadcast-info">
          <h4 className="broadcast-title">{broadcast.title}</h4>
          <span className="broadcast-meta">{sentDate}</span>
        </div>
        <div className="broadcast-badges">
          <span className={`tier-badge ${tierColor}`}>
            {broadcast.tier === 'all' ? 'All Members' : broadcast.tier}
          </span>
          {broadcast.status && (
            <span className={`status ${statusColor}`}>
              {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1)}
            </span>
          )}
        </div>
      </div>

      <div className="broadcast-preview">
        <p className="broadcast-message">{formattedMessage}</p>
      </div>
    </div>
  );
}