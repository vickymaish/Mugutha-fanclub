import { useEffect, useState } from 'react'
import { apiFetch } from '../../services/api'

// Shows exactly what members will get (message, directions link and
// how many members) before the admin sends a match-day alert.
export default function AlertModal({ fixture, onClose, onSent }) {
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    let alive = true
    apiFetch(`/fixtures/${fixture.id}/alert-preview`)
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Could not load the preview')
        if (alive) setPreview(body)
      })
      .catch((err) => alive && setResult({ type: 'error', text: err.message }))
    return () => { alive = false }
  }, [fixture.id])

  async function send() {
    setBusy(true)
    setResult(null)
    try {
      const res = await apiFetch(`/fixtures/${fixture.id}/alert`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Sending failed')
      setResult({ type: 'success', text: `Sent to ${body.sent} of ${body.total} members${body.failed ? ` (${body.failed} failed, see server log)` : ''}.` })
      onSent?.(body)
    } catch (err) {
      setResult({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const done = result?.type === 'success'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Match-day alert</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {!preview && !result && <div className="modal-section"><p>Loading preview…</p></div>}

        {preview && (
          <>
            <div className="modal-section">
              <span className="modal-label">What members will see (with their own name)</span>
              <div style={{ background: '#e7f6e7', borderRadius: 10, padding: '12px 14px', fontSize: 14, lineHeight: 1.5 }}>
                <strong>Match day is coming</strong><br />
                {preview.text}
                <div style={{ marginTop: 8, color: '#64748b', fontSize: 12 }}>Reply STOP to stop these messages</div>
                <a href={preview.mapUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 8, textAlign: 'center', fontWeight: 600 }}>📍 Get directions</a>
              </div>
            </div>
            <div className="modal-section">
              <span className="modal-label">Goes to</span>
              <p style={{ margin: 0 }}><strong>{preview.recipients}</strong> active members (members who replied STOP are left out).</p>
              <small className="text-muted">Alerts also go out automatically at 6 pm the day before and 8 am on match day.</small>
            </div>
          </>
        )}

        {result && <div className={`modal-result ${result.type}`}>{result.text}</div>}

        <div className="modal-actions">
          <button type="button" className="modal-cancel" onClick={onClose}>{done ? 'Close' : 'Cancel'}</button>
          {!done && (
            <button type="button" className="modal-send" onClick={send} disabled={busy || !preview || !preview.recipients}>
              {busy ? 'Sending…' : `Send to ${preview?.recipients ?? 0} members`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
