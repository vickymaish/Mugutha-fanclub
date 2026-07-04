// frontend/src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const linkStyle = ({ isActive }) => ({
    display: 'block',
    padding: 'var(--spacing-12) var(--spacing-20)',
    borderRadius: 'var(--radius-navpill)',
    backgroundColor: isActive ? 'var(--color-signal-orange)' : 'transparent',
    color: isActive ? 'white' : 'var(--color-graphite)',
    textDecoration: 'none',
    fontFamily: 'var(--font-inter)',
    fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
    marginBottom: 'var(--spacing-8)',
    transition: 'all 0.2s'
  });

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--surface-paper)',
      borderRight: `1px solid var(--color-chalk)`,
      padding: 'var(--spacing-36) var(--spacing-20)',
      height: 'calc(100vh - 70px)', // adjust if navbar height changes
      position: 'sticky',
      top: 0
    }}>
      <nav>
        <NavLink to="/" end style={linkStyle}>Dashboard</NavLink>
        <NavLink to="/members" style={linkStyle}>Members</NavLink>
        <NavLink to="/broadcasts" style={linkStyle}>Broadcasts</NavLink>
      </nav>
    </aside>
  );
}