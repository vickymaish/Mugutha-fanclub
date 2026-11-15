import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import { getSession, onAuthChange } from './services/auth'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Fixtures from './pages/Fixtures'
import Broadcasts from './pages/Broadcasts'
import Templates from './pages/Templates'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Payments from './pages/Payments'
import './styles.css'


function App() {
  const [session, setSession] = useState(getSession())
  useEffect(() => onAuthChange(setSession), [])

  if (!session) return <Login />

  return (
    <div className="dashboard-shell">
      <Sidebar email={session.email} />
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/fixtures" element={<Fixtures />} />
          <Route path="/broadcasts" element={<Broadcasts />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          
        </Routes>
      </main>
    </div>
  )
}

export default App
