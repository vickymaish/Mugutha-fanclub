// frontend/src/components/StatsCard.jsx
import React from 'react';

export default function StatsCard({ title, value }) {
  return (
    <div className="card" style={{ 
      flex: 1, 
      minWidth: '200px', 
      textAlign: 'center',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}>
      <h3 style={{ 
        fontSize: 'var(--text-body-lg)', 
        color: 'var(--color-graphite)',
        fontFamily: 'var(--font-polysans)',
        fontWeight: 'var(--font-weight-medium)',
        marginBottom: 'var(--spacing-12)'
      }}>
        {title}
      </h3>
      <p style={{ 
        fontSize: 'var(--text-display)', 
        fontWeight: 'var(--font-weight-semibold)', 
        color: 'var(--color-signal-orange)',
        fontFamily: 'var(--font-polysans)',
        lineHeight: 1
      }}>
        {value}
      </p>
    </div>
  );
}