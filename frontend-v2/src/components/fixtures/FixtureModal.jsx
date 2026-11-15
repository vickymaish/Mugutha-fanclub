import { useState } from 'react'
import { createFixture } from '../../services/fixtures'

// Add a match. The map pin is optional: without it, home games use the club's
// ground (CLUB_GROUND_LAT/LNG in the backend .env) and away games are looked up
// by name. With it, the weather forecast and "Get directions" are exact.
export default function FixtureModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    home_team: 'Mugutha FC', away_team: '', date: '', time: '15:00',
    venue: '', competition: '', pin: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  function parsePin(value) {
    if (!value.trim()) return { venue_lat: null, venue_lng: null }
    const match = value.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/)
    if (!match) return null
    return { venue_lat: Number(match[1]), venue_lng: Number(match[2]) }
  }

  async function submit(event) {
    event.preventDefault()
    const pin = parsePin(form.pin)
    if (!pin) {
      setError('Map pin should look like -1.1520, 36.9615 (in Google Maps, right-click the ground and copy the numbers).')
      return
    }
    setBusy(true)
    setError('')
    const { pin: _pin, ...fields } = form
    const saved = await createFixture({ ...fields, ...pin, status: 'upcoming' })
    setBusy(false)
    if (!saved) {
      setError('Could not save the match. Check the backend is running.')
      return
    }
    onSaved?.()
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-header">
          <h3>Add a match</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-section">
          <label className="modal-label" htmlFor="fx-home">Home team</label>
          <input id="fx-home" className="modal-select" value={form.home_team} onChange={set('home_team')} required />
        </div>
        <div className="modal-section">
          <label className="modal-label" htmlFor="fx-away">Away team</label>
          <input id="fx-away" className="modal-select" value={form.away_team} onChange={set('away_team')} placeholder="Kahawa United" required />
        </div>
        <div className="modal-section" style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="modal-label" htmlFor="fx-date">Date</label>
            <input id="fx-date" type="date" className="modal-select" value={form.date} onChange={set('date')} required />
          </div>
          <div style={{ flex: 1 }}>
            <label className="modal-label" htmlFor="fx-time">Kick-off</label>
            <input id="fx-time" type="time" className="modal-select" value={form.time} onChange={set('time')} required />
          </div>
        </div>
        <div className="modal-section">
          <label className="modal-label" htmlFor="fx-venue">Ground</label>
          <input id="fx-venue" className="modal-select" value={form.venue} onChange={set('venue')} placeholder="Mugutha Grounds, Ruiru" required />
        </div>
        <div className="modal-section">
          <label className="modal-label" htmlFor="fx-pin">Map pin (optional)</label>
          <input id="fx-pin" className="modal-select" value={form.pin} onChange={set('pin')} placeholder="-1.1520, 36.9615" />
          <small className="text-muted">In Google Maps, right-click the ground and click the numbers to copy them. Used for the weather forecast and directions.</small>
        </div>
        <div className="modal-section">
          <label className="modal-label" htmlFor="fx-comp">Competition (optional)</label>
          <input id="fx-comp" className="modal-select" value={form.competition} onChange={set('competition')} placeholder="County League" />
        </div>

        {error && <div className="modal-result error">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="modal-cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="modal-send" disabled={busy}>{busy ? 'Saving…' : 'Save match'}</button>
        </div>
      </form>
    </div>
  )
}
