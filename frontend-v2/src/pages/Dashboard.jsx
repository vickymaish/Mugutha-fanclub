import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BroadcastModal from '../components/BroadcastModal';
import AlertModal from '../components/fixtures/AlertModal';
import { getSummary, sendRenewalReminders } from '../services/dashboard';
import { getSession } from '../services/auth';

// ── Icons ──────────────────────────────────────────────────────────────────
function Icon({ children, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const Award         = (p) => <Icon {...p}><circle cx="12" cy="8" r="5"/><path d="m8.5 12.5-2 7 5.5-3 5.5 3-2-7"/></Icon>;
const BarChart3     = (p) => <Icon {...p}><path d="M4 20V10"/><path d="M12 20V4"/><path d="M20 20v-7"/></Icon>;
const Bell          = (p) => <Icon {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></Icon>;
const Calendar      = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 11h18"/></Icon>;
const CalendarPlus  = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 11h18"/><path d="M12 15v4"/><path d="M10 17h4"/></Icon>;
const ChevronRight  = (p) => <Icon {...p}><path d="m9 18 6-6-6-6"/></Icon>;
const Clock         = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>;
const FileText      = (p) => <Icon {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></Icon>;
const LayoutDash    = (p) => <Icon {...p}><rect x="3" y="3" width="7" height="8" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="15" width="7" height="6" rx="1"/></Icon>;
const Megaphone     = (p) => <Icon {...p}><path d="m3 11 18-6v14L3 13z"/><path d="M7 14v5"/></Icon>;
const MessageCircle = (p) => <Icon {...p}><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.4-5A8.5 8.5 0 1 1 21 11.5Z"/></Icon>;
const Search        = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></Icon>;
const Send          = (p) => <Icon {...p}><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></Icon>;
const SettingsIcon  = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.1 2.1-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.7V21h-3v-.2a1.8 1.8 0 0 0-1.2-1.7 1.8 1.8 0 0 0-2 .4l-.1.1-2.1-2.1.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 5 14.2H4v-3h1a1.8 1.8 0 0 0 1.7-1.2 1.8 1.8 0 0 0-.4-2l-.1-.1 2.1-2.1.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 11.6 5V4h3v1a1.8 1.8 0 0 0 1.1 1.7 1.8 1.8 0 0 0 2-.4l.1-.1 2.1 2.1-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1.1h1v3h-1a1.8 1.8 0 0 0-1.6 1.2Z"/></Icon>;
const ShieldAlert   = (p) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 8v4"/><path d="M12 16h.01"/></Icon>;
const Trophy        = (p) => <Icon {...p}><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M5 6H3a3 3 0 0 0 4 4"/><path d="M19 6h2a3 3 0 0 1-4 4"/></Icon>;
const Upload        = (p) => <Icon {...p}><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/></Icon>;
const Users         = (p) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.8"/><path d="M16 3.3a4 4 0 0 1 0 7.4"/></Icon>;

// ── Helpers ────────────────────────────────────────────────────────────────
const ksh = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
const dayMonth = (d) => (d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : '—');
function kickoff(time) {
  if (!time) return 'time TBC';
  const [h, m] = time.split(':').map(Number);
  const d = new Date(); d.setHours(h, m || 0);
  return d.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function greetingName() {
  const email = getSession()?.email || '';
  const name = email.split('@')[0].split(/[._-]/)[0];
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'there';
}

// ── Small components ──────────────────────────────────────────────────────
function ClubLogo({ size = 'medium', name }) {
  return <img src="/logo.png" alt={name} className={`club-logo ${size}`} />;
}

function Metric({ icon: Ic, label, value, note, tone }) {
  return (
    <section className="metric">
      <div className={`metric-icon ${tone}`}><Ic size={18} /></div>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{note}</small>
    </section>
  );
}

function QuickAction({ icon: Ic, title, subtitle, tone, onClick, disabled }) {
  return (
    <button className="quick-action" onClick={onClick} type="button" disabled={disabled}>
      <span className={`quick-icon ${tone}`}><Ic size={18} /></span>
      <span><strong>{title}</strong><small>{subtitle}</small></span>
      <ChevronRight size={16} />
    </button>
  );
}

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: type === 'error' ? '#b91c1c' : '#1a4d2e',
      color: '#fff', padding: '10px 20px', borderRadius: 10,
      fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 9999,
    }}>
      {message}
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalTier, setModalTier] = useState('all');
  const [alertFor, setAlertFor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3500);
  };

  const load = useCallback(async () => {
    try { setData(await getSummary()); setError(''); } catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const loading = !data && !error;
  const m = data?.members || { active: 0, byTier: {}, endingIn7Days: 0, endingIn30Days: 0, lapsed: 0, optedOut: 0 };
  const money = data?.money || {};
  const msgs = data?.messages || {};
  const upcoming = data?.fixtures?.upcoming || [];
  const tiers = data?.tiers || [];
  const club = data?.club || { name: 'Mugutha FC' };
  const next = upcoming[0];
  const show = (v) => (loading ? '…' : v);

  async function remindNow() {
    setBusy(true);
    try {
      const r = await sendRenewalReminders();
      showToast(r.sent ? `Renewal reminders sent to ${r.sent} member${r.sent > 1 ? 's' : ''}.` : 'No reminders were due. Each member gets one 7 days and one 1 day before.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const openModal = (tier) => { setModalTier(tier); setShowModal(true); };

  return (
    <div className="dashboard-content">
      <header className="topbar">
        <div className="welcome">
          <ClubLogo size="small" name={club.name} />
          <div><p>Welcome, {greetingName()}</p><h2>Membership and matchday control center</h2></div>
        </div>
        <div className="top-actions">
          <button className="icon-button" aria-label="Memberships ending soon" title={`${m.endingIn7Days} memberships end within 7 days`} onClick={() => navigate('/members')}>
            <Bell size={18} />{m.endingIn7Days > 0 && <span />}
          </button>
        </div>
      </header>

      <section className="hero-panel">
        <div>
          {club.league && <span className="eyebrow">{club.league}</span>}
          <h2>{club.name}</h2>
          <p>Supporters join, pay and get match alerts on WhatsApp. Everything they do shows up here.</p>
        </div>
        <div className="connection-pill" title={data?.whatsapp?.mode === 'live' ? 'Messages go to real WhatsApp numbers' : 'Messages are printed in the server log, not sent'}>
          <MessageCircle size={16} />{data?.whatsapp?.mode === 'live' ? 'WhatsApp live' : 'WhatsApp test mode'}
        </div>
      </section>

      {error && <section className="alert"><ShieldAlert size={19} /><p>Could not load the dashboard: {error}. Is the backend running?</p></section>}

      {data?.demo?.members > 0 && (
        <section className="alert">
          <ShieldAlert size={19} />
          <p>Showing demo data ({data.demo.members} demo members). <button onClick={() => navigate('/settings')}>Manage demo data</button></p>
        </section>
      )}

      {!error && (
        <section className="alert">
          <ShieldAlert size={19} />
          <p>
            {m.endingIn7Days > 0
              ? `${show(m.endingIn7Days)} membership${m.endingIn7Days > 1 ? 's' : ''} end within 7 days. Reminders go out automatically at 10 am. `
              : 'No memberships end this week. '}
            {m.endingIn7Days > 0 && <button onClick={remindNow} disabled={busy}>{busy ? 'Sending…' : 'Send due reminders now'}</button>}
          </p>
        </section>
      )}

      <section className="metrics-grid">
        <Metric icon={Users}        value={show(m.active)}                     label="Active members"       note={`${show(m.lapsed)} lapsed · ${show(m.optedOut)} replied STOP`} tone="blue"  />
        <Metric icon={Award}        value={show(ksh(money.last12MonthsKsh))}   label="Collected, 12 months" note={`${ksh(money.thisMonthKsh)} this month · ${money.waitingForPin || 0} waiting for PIN`} tone="green" />
        <Metric icon={CalendarPlus} value={show(upcoming.length)}              label="Upcoming matches"     note={next ? `Next: ${dayMonth(next.date)}` : 'None scheduled'} tone="sky"   />
        <Metric icon={Megaphone}    value={show(msgs.sent30Days ?? 0)}         label="Messages, 30 days"    note={msgs.deliveredShare == null ? 'None sent yet' : `${msgs.deliveredShare}% sent without error`} tone="red"   />
      </section>

      <section className="workspace-grid">
        <div className="panel">
          <div className="panel-head"><h3>Member tiers</h3><button onClick={() => navigate('/members')}>View members</button></div>
          {(tiers.length ? tiers : [{ key: 'gold', label: 'Gold' }, { key: 'silver', label: 'Silver' }, { key: 'bronze', label: 'Bronze' }])
            .slice().reverse()
            .map(({ key, label }) => {
              const n = m.byTier?.[key] || 0;
              const width = m.active ? Math.round((n / m.active) * 100) : 0;
              return (
                <div className="tier" key={key}>
                  <div><span className={key}>{label}</span><strong>{show(n)}</strong></div>
                  <div className="bar"><i className={key} style={{ width: `${width}%` }} /></div>
                </div>
              );
            })}
          <p className="muted">
            {tiers.length ? `Yearly membership: ${tiers.map((t) => `${t.label} ${ksh(t.price)}`).join(' · ')}` : ''}
            {money.mpesaKsh || money.cashKsh ? ` · Paid by M-Pesa ${ksh(money.mpesaKsh)}, cash ${ksh(money.cashKsh)}` : ''}
          </p>
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Upcoming matches</h3><button onClick={() => navigate('/fixtures')}>All fixtures</button></div>
          <div className="fixture-list">
            {loading ? <p>Loading…</p> : upcoming.length === 0 ? (
              <p>No matches scheduled. <button className="link-button" onClick={() => navigate('/fixtures')}>Add one</button></p>
            ) : upcoming.map((f) => (
              <article key={f.id}>
                <time>{dayMonth(f.date)}</time>
                <div>
                  <strong>{f.home_team} vs {f.away_team}</strong>
                  <span>{f.venue || 'Venue TBC'}, {kickoff(f.time)}</span>
                </div>
                <button onClick={() => setAlertFor(f)}>Alert</button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="panel broadcast-panel">
          <div className="panel-head"><h3>Recent broadcasts</h3><button onClick={() => navigate('/broadcasts')}>View all</button></div>
          {(data?.broadcasts || []).length === 0 ? (
            <p className="muted">No broadcasts yet. Match alerts and announcements you send will appear here.</p>
          ) : (
            <table>
              <thead><tr><th>Message</th><th>Audience</th><th>When</th><th>Status</th></tr></thead>
              <tbody>
                {data.broadcasts.map((b) => (
                  <tr key={b.id}>
                    <td>{b.title || (b.message || '').slice(0, 40)}</td>
                    <td>{b.tier && b.tier !== 'all' ? `${b.tier.charAt(0).toUpperCase()}${b.tier.slice(1)} tier` : 'All members'}</td>
                    <td>{dayMonth(b.sent_at || b.scheduled_for || b.created_at)}</td>
                    <td><span className={`status ${String(b.status || 'pending').toLowerCase()}`}>{b.status || 'pending'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel actions-panel">
          <div className="panel-head"><h3>Quick actions</h3><Award size={18} /></div>
          <QuickAction icon={Trophy} title="Send match alert"      subtitle={next ? `${next.home_team} vs ${next.away_team}` : 'Add a match first'} tone="blue" onClick={() => (next ? setAlertFor(next) : navigate('/fixtures'))} />
          <QuickAction icon={Bell}   title="Renewal reminders"     subtitle={`${m.endingIn30Days} end within 30 days`}                              tone="red"  onClick={remindNow} disabled={busy} />
          <QuickAction icon={Award}  title="Gold tier broadcast"   subtitle={`${m.byTier?.gold || 0} gold supporters`}                              tone="gold" onClick={() => openModal('gold')} />
          <QuickAction icon={Upload} title="Record cash payment"   subtitle="Money collected at the gate"                                           tone="sky"  onClick={() => navigate('/payments')} />
        </div>
      </section>

      <BroadcastModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSend={() => { setShowModal(false); showToast('Broadcast sent.'); load(); }}
        tierCounts={{ total: m.active, gold: m.byTier?.gold || 0, silver: m.byTier?.silver || 0, bronze: m.byTier?.bronze || 0 }}
        preSelectedTier={modalTier}
      />
      {alertFor && <AlertModal fixture={alertFor} onClose={() => setAlertFor(null)} onSent={load} />}

      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}
