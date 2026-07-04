import { Link } from 'react-router-dom'
import './Sidebar.css'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Mugutha</h2>
      </div>
      <nav className="sidebar-nav">
        <Link to="/" className="nav-link">Dashboard</Link>
        <Link to="/members" className="nav-link">Members</Link>
        <Link to="/fixtures" className="nav-link">Fixtures</Link>
        <Link to="/broadcasts" className="nav-link">Broadcasts</Link>
        <Link to="/templates" className="nav-link">Templates</Link>
        <Link to="/analytics" className="nav-link">Analytics</Link>
        <Link to="/settings" className="nav-link">Settings</Link>
      </nav>
    </aside>
  )
}
