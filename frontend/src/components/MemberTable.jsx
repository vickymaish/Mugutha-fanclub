// frontend/src/components/MemberTable.jsx
import React from 'react';

export default function MemberTable({ members = [] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid var(--color-chalk)`, textAlign: 'left' }}>
            <th style={{ padding: 'var(--spacing-12) var(--spacing-16)', fontFamily: 'var(--font-polysans)', fontWeight: 'var(--font-weight-semibold)' }}>Name</th>
            <th style={{ padding: 'var(--spacing-12) var(--spacing-16)', fontFamily: 'var(--font-polysans)', fontWeight: 'var(--font-weight-semibold)' }}>Phone</th>
            <th style={{ padding: 'var(--spacing-12) var(--spacing-16)', fontFamily: 'var(--font-polysans)', fontWeight: 'var(--font-weight-semibold)' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} style={{ borderBottom: `1px solid var(--color-mist)` }}>
              <td style={{ padding: 'var(--spacing-12) var(--spacing-16)', color: 'var(--color-carbon)' }}>{member.name}</td>
              <td style={{ padding: 'var(--spacing-12) var(--spacing-16)', color: 'var(--color-graphite)' }}>{member.phone}</td>
              <td style={{ padding: 'var(--spacing-12) var(--spacing-16)' }}>
                <span style={{
                  backgroundColor: member.membership_status === 'active' ? 'var(--color-signal-orange)' : 'var(--color-slate)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-tags)',
                  fontSize: 'var(--text-caption)',
                  fontFamily: 'var(--font-inter)'
                }}>
                  {member.membership_status || 'active'}
                </span>
              </td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr>
              <td colSpan="3" style={{ padding: 'var(--spacing-36)', textAlign: 'center', color: 'var(--color-slate)' }}>
                No members found
              </td>
            </tr>
          )}
        </tbody>
       </table>
    </div>
  );
}