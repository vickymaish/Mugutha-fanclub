import { useEffect, useState } from 'react'
import { getTiers, recordCash, requestMpesa } from '../services/payments'

// mode 'cash': treasurer records money received at the field (activates now).
// mode 'mpesa': sends an M-Pesa PIN prompt to the supporter's phone.
export default function PaymentModal({ mode, onClose, onDone }) {
  const [tiers, setTiers] = useState([])
  const [form, setForm] = useState({ name: '', phone: '', tier: 'bronze', amount: '' })
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => { getTiers().then(setTiers).catch(() => setTiers([])) }, [])

  const tier = tiers.find((t) => t.key === form.tier)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const isCash = mode === 'cash'

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setResult(null)
    try {
      if (isCash) {
        const { member } = await recordCash(form)
        setResult({ type: 'success', text: `Recorded. ${member.name} is now a ${member.tier} member (${member.member_number || 'number pending'}). Their receipt is on its way on WhatsApp.` })
      } else {
        const { amount } = await requestMpesa(form)
        setResult({ type: 'success', text: `M-Pesa prompt for KSh ${Number(amount).toLocaleString('en-KE')} sent. Once they enter their PIN, the membership activates and their card is sent.` })
      }
      onDone?.()
    } catch (err) {
      setResult({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-header">
          <h3>{isCash ? 'Record cash payment' : 'Send M-Pesa request'}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-section">
          <label className="modal-label" htmlFor="pm-name">Supporter's name (as on the card)</label>
          <input id="pm-name" className="modal-select" value={form.name} onChange={set('name')} placeholder="James Mwangi" required />
        </div>
        <div className="modal-section">
          <label className="modal-label" htmlFor="pm-phone">{isCash ? 'Phone number (for their WhatsApp receipt)' : 'M-Pesa phone number'}</label>
          <input id="pm-phone" className="modal-select" value={form.phone} onChange={set('phone')} placeholder="0712 345 678" inputMode="tel" required />
        </div>
        <div className="modal-section">
          <label className="modal-label" htmlFor="pm-tier">Tier</label>
          <select id="pm-tier" className="modal-select" value={form.tier} onChange={set('tier')}>
            {(tiers.length ? tiers : [{ key: 'bronze', label: 'Bronze' }, { key: 'silver', label: 'Silver' }, { key: 'gold', label: 'Gold' }]).map((t) => (
              <option key={t.key} value={t.key}>{t.label}{t.price ? ` · KSh ${t.price.toLocaleString('en-KE')}` : ''}</option>
            ))}
          </select>
        </div>
        {isCash && (
          <div className="modal-section">
            <label className="modal-label" htmlFor="pm-amount">Amount received (KSh)</label>
            <input id="pm-amount" className="modal-select" value={form.amount} onChange={set('amount')} inputMode="numeric"
              placeholder={tier ? `${tier.price} (leave empty for the full price)` : 'Leave empty for the full price'} />
          </div>
        )}

        {result && <div className={`modal-result ${result.type}`}>{result.text}</div>}

        <div className="modal-actions">
          <button type="button" className="modal-cancel" onClick={onClose}>{result?.type === 'success' ? 'Close' : 'Cancel'}</button>
          <button type="submit" className="modal-send" disabled={busy}>
            {busy ? 'Working…' : isCash ? 'Record payment' : 'Send prompt'}
          </button>
        </div>
      </form>
    </div>
  )
}
