// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav style={{
      backgroundColor: 'var(--surface-paper)',
      borderBottom: `1px solid var(--color-chalk)`,
      padding: 'var(--spacing-16) var(--spacing-40)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: 'var(--font-polysans)'
    }}>
      <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--text-body-lg)', color: 'var(--color-carbon)' }}>
        Mugutha FC Platform
      </div>
      <div style={{ display: 'flex', gap: 'var(--spacing-36)' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--color-graphite)' }}>Dashboard</Link>
        <Link to="/members" style={{ textDecoration: 'none', color: 'var(--color-graphite)' }}>Members</Link>
        <Link to="/broadcasts" style={{ textDecoration: 'none', color: 'var(--color-graphite)' }}>Broadcasts</Link>
      </div>
    </nav>
  );
}