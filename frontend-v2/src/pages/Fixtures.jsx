import { useState } from 'react'
import useFixtures from '../hooks/useFixtures'
import FixturesTable from '../components/fixtures/FixturesTable'
import FixtureModal from '../components/fixtures/FixtureModal'
import AlertModal from '../components/fixtures/AlertModal'

export default function Fixtures() {
  const { fixtures, loading, refreshFixtures } = useFixtures()
  const [adding, setAdding] = useState(false)
  const [alertFor, setAlertFor] = useState(null)

  const upcomingCount = fixtures.filter((f) => f.status === 'upcoming').length

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Fixtures</h1>
          <p>Matches, and the WhatsApp alerts members get before each one</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => setAdding(true)}>+ Add match</button>
        </div>
      </header>

      <div className="panel">
        <div className="panel-head">
          <h3>All fixtures</h3>
          <span className="fixture-count">
            {upcomingCount} upcoming · {fixtures.length} total
          </span>
        </div>
        <FixturesTable fixtures={fixtures} loading={loading} onSendAlert={setAlertFor} />
      </div>

      {adding && <FixtureModal onClose={() => setAdding(false)} onSaved={refreshFixtures} />}
      {alertFor && <AlertModal fixture={alertFor} onClose={() => setAlertFor(null)} onSent={refreshFixtures} />}
    </div>
  )
}
