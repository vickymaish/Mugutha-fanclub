import React from 'react';
import StatsCard from '../components/StatsCard';

export default function Dashboard() {
  return (
    <div className="page-container">
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', gap: 'var(--spacing-20)', flexWrap: 'wrap' }}>
        <StatsCard title="Members" value={123} />
        <StatsCard title="Broadcasts Sent" value={45} />
        <StatsCard title="Active Members" value={98} />
      </div>
    </div>
  );
}