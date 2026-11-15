import { useCallback, useEffect, useState } from 'react'
import PaymentModal from '../components/PaymentModal'
import { getPayments } from '../services/payments'

const STATUS = {
  paid: { label: 'Paid', cls: 'status delivered' },
  pending: { label: 'Waiting for PIN', cls: 'status waiting' },
  failed: { label: 'Not completed', cls: 'status failed' },
}

function when(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // 'cash' | 'mpesa' | null

  const load = useCallback(async () => {
    try {
      setPayments(await getPayments())
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh every 15 seconds so "Waiting for PIN" turns into "Paid" on its own.
  useEffect(() => {
    load()
    const timer = setInterval(load, 15000)
    return () => clearInterval(timer)
  }, [load])

  const paid = payments.filter((p) => p.status === 'paid')
  const total = paid.reduce((sum, p) => sum + p.amount, 0)
  const mpesa = paid.filter((p) => p.method === 'mpesa').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Payments</h1>
          <p>Memberships paid by M-Pesa and cash</p>
        </div>
        <div className="page-actions">
          <button className="btn-secondary" onClick={() => setModal('cash')}>Record cash payment</button>
          <button className="btn-primary" onClick={() => setModal('mpesa')}>Send M-Pesa request</button>
        </div>
      </header>

      <div className="panel">
        <div className="panel-head">
          <h3>Recent payments</h3>
          <span className="member-count">
            KSh {total.toLocaleString('en-KE')} collected · M-Pesa {mpesa.toLocaleString('en-KE')} · Cash {(total - mpesa).toLocaleString('en-KE')}
          </span>
        </div>

        {loading ? (
          <div className="loading-state"><p>Loading payments…</p></div>
        ) : error ? (
          <div className="empty-state"><p>{error}</p></div>
        ) : payments.length === 0 ? (
          <div className="empty-state"><p>No payments yet. When fans reply JOIN on WhatsApp, their payments appear here.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="members-table">
              <thead>
                <tr><th>Supporter</th><th>Tier</th><th>Amount</th><th>Method</th><th>Status</th><th>Receipt</th><th>When</th></tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="member-name">{p.name || p.phone}</td>
                    <td><span className={`tier-badge ${p.tier}`}>{p.tier.charAt(0).toUpperCase() + p.tier.slice(1)}</span></td>
                    <td><strong>KSh {p.amount.toLocaleString('en-KE')}</strong></td>
                    <td>{p.method === 'mpesa' ? 'M-Pesa' : 'Cash'}{p.source === 'whatsapp' ? ' · WhatsApp' : ''}</td>
                    <td><span className={(STATUS[p.status] || STATUS.pending).cls} title={p.failure_reason || ''}>{(STATUS[p.status] || STATUS.pending).label}</span></td>
                    <td>{p.mpesa_receipt || (p.method === 'cash' ? `by ${p.recorded_by || 'admin'}` : '—')}</td>
                    <td>{when(p.paid_at || p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <PaymentModal mode={modal} onClose={() => setModal(null)} onDone={load} />}
    </div>
  )
}
