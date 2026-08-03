import React from 'react';
import BroadcastCard from './BroadcastCard';

export default function BroadcastList({ broadcasts, loading }) {
  if (loading) {
    return <div className="loading-state"><p>Loading broadcasts...</p></div>;
  }

  if (!broadcasts || broadcasts.length === 0) {
    return (
      <div className="empty-state">
        <p>No broadcasts sent yet. Send your first message!</p>
      </div>
    );
  }

  return (
    <div className="broadcast-list">
      {broadcasts.map((broadcast) => (
        <BroadcastCard key={broadcast.id} broadcast={broadcast} />
      ))}
    </div>
  );
}