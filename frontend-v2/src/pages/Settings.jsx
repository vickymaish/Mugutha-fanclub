import { useEffect, useState } from 'react'
import { clearDemo, getSummary, loadDemo } from '../services/dashboard'

// Club settings. For now: demo data, used to show the app to other clubs.
export default function Settings() {
  const [demo, setDemo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  const refresh = () => getSummary().then((s) => setDemo(s.demo)).catch(() => setDemo(null))
  useEffect(() => { refresh() }, [])

  async function run(action) {
    setBusy(true)
    setResult(null)
    try {
      if (action === 'load') {
        const r = await loadDemo()
        setResult({ type: 'success', text: `Loaded ${r.members} demo members, ${r.payments} payments and ${r.fixtures} matches.` })
      } else {
        await clearDemo()
        setResult({ type: 'success', text: 'Demo data removed. Real members and payments were not touched.' })
      }
      await refresh()
    } catch (err) {
      setResult({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Club setup and demo data</p>
        </div>
      </header>

      <div className="panel">
        <div className="panel-head"><h3>Demo data</h3></div>
        <p>
          Fills the dashboard with 36 made-up supporters, their payments and five matches, so you can show
          the app to another club without showing real fans' details.
        </p>
        <ul className="muted">
          <li>Demo members have fake phone numbers, and alerts, reminders and broadcasts skip them.</li>
          <li>Loading again replaces the old demo data. Removing it never touches real members.</li>
        </ul>
        <p><strong>Now:</strong> {demo ? `${demo.members} demo members, ${demo.payments} demo payments` : 'unknown'}</p>
        {result && <div className={`modal-result ${result.type}`}>{result.text}</div>}
        <div className="page-actions" style={{ marginTop: 12 }}>
          <button className="btn-primary" onClick={() => run('load')} disabled={busy}>{busy ? 'Working…' : 'Load demo data'}</button>
          <button className="btn-secondary" onClick={() => run('clear')} disabled={busy || !demo?.members}>Remove demo data</button>
        </div>
      </div>
    </div>
  )
}
