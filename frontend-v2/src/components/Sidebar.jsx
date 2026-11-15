import { Link } from 'react-router-dom'
import { signOut } from '../services/auth'

const NAV = [
  { path: '/', label: 'Dashboard' },
  { path: '/members', label: 'Members' },
  { path: '/payments', label: 'Payments' },
  { path: '/fixtures', label: 'Fixtures' },
  { path: '/broadcasts', label: 'Broadcasts' },
  { path: '/templates', label: 'Templates' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/settings', label: 'Settings' },
]

export default function Sidebar({ email = '' }) {
  const initials = (email.split('@')[0] || 'A').slice(0, 2).toUpperCase()
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="club-logo">
          <div className="crest-crop" />
        </div>
        <div>
          <h1>Mugutha FC</h1>
          <p>#MoreThanFootball</p>
        </div>
      </div>
      <nav className="nav-list" aria-label="Main navigation">
        {NAV.map(item => (
          <Link to={item.path} key={item.label} className="nav-link">
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="owner-card">
        <div className="avatar">{initials}</div>
        <div className="owner-meta">
          <strong title={email}>{email}</strong>
          <button type="button" className="signout" onClick={signOut}>Sign out</button>
        </div>
      </div>
    </aside>
  )
}
