import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import BroadcastModal from './components/BroadcastModal';

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

// ── Static data ───────────────────────────────────────────────────────────
const BROADCASTS = [
  { type: 'Match alert',      audience: 'All members', time: 'Jun 22, 10:00', status: 'Delivered' },
  { type: 'Lineup update',    audience: 'Silver+',     time: 'Jun 22, 13:00', status: 'Read'      },
  { type: 'Merch drop',       audience: 'All members', time: 'Jun 18, 09:00', status: 'Delivered' },
  { type: 'Renewal reminder', audience: '4 expiring',  time: 'Jun 17, 08:00', status: 'Read'      },
  { type: 'Sponsor update',   audience: 'Gold tier',   time: 'Jun 15, 11:00', status: 'Pending'   },
];

const FIXTURES = [
  { date: 'Sun 29 Jun', title: 'Mugutha FC vs Ruiru United', meta: 'Mugutha Grounds, 3:00 PM', action: 'Alert' },
  { date: 'Sun 6 Jul',  title: 'Kiambu Stars vs Mugutha FC', meta: 'Away, 2:30 PM',            action: 'Draft' },
  { date: 'Sun 13 Jul', title: 'Mugutha FC vs Thika Rovers', meta: 'Mugutha Grounds, 3:00 PM', action: 'Draft' },
];

const NAV = [
  { label: 'Dashboard', icon: LayoutDash    },
  { label: 'Members',   icon: Users         },
  { label: 'Fixtures',  icon: Calendar      },
  { label: 'Broadcasts',icon: Send          },
  { label: 'Templates', icon: FileText      },
  { label: 'Analytics', icon: BarChart3     },
  { label: 'Settings',  icon: SettingsIcon  },
];

// ── Small components ──────────────────────────────────────────────────────
function ClubLogo({ size = 'medium' }) {
  return (
    <div className={`club-logo ${size}`} aria-label="Mugutha Football Club logo">
      <div className="crest-crop" />
    </div>
  );
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

function QuickAction({ icon: Ic, title, subtitle, tone, onClick }) {
  return (
    <button className="quick-action" onClick={onClick} type="button">
      <span className={`quick-icon ${tone}`}><Ic size={18} /></span>
      <span><strong>{title}</strong><small>{subtitle}</small></span>
      <ChevronRight size={16} />
    </button>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────
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

// ── App ───────────────────────────────────────────────────────────────────
function App() {
  const [members,   setMembers]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTier, setModalTier] = useState('all');
  const [toast,     setToast]     = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3500);
  };

  // Fetch members from live backend
  useEffect(() => {
    fetch('http://localhost:5000/api/members')
      .then(r => r.json())
      .then(data => { setMembers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(err => { console.error('Failed to load members:', err); setLoading(false); });
  }, []);

  // Derived counts — no separate tierCounts endpoint needed
  const totalMembers  = members.length;
  const goldCount     = members.filter(m => m.tier === 'gold').length;
  const silverCount   = members.filter(m => m.tier === 'silver').length;
  const bronzeCount   = members.filter(m => m.tier === 'bronze').length;

  const goldWidth   = totalMembers > 0 ? Math.round((goldCount   / totalMembers) * 100) : 0;
  const silverWidth = totalMembers > 0 ? Math.round((silverCount / totalMembers) * 100) : 0;
  const bronzeWidth = totalMembers > 0 ? Math.round((bronzeCount / totalMembers) * 100) : 0;

  const expiringSoon = members.filter(m => {
    if (!m.renewal_date) return false;
    const days = Math.ceil((new Date(m.renewal_date) - new Date()) / 86400000);
    return days <= 7 && days > 0;
  }).length;

  const openModal = (tier) => { setModalTier(tier); setShowModal(true); };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <ClubLogo />
          <div><h1>Mugutha FC</h1><p>#MoreThanFootball</p></div>
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          {NAV.map(item => (
            <button className={item.label === 'Dashboard' ? 'active' : ''} key={item.label}>
              <item.icon size={17} />{item.label}
            </button>
          ))}
        </nav>
        <div className="owner-card">
          <div className="avatar">NJ</div>
          <div><strong>Njagi</strong><span>Club Owner</span></div>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="welcome">
            <ClubLogo size="small" />
            <div><p>Welcome, Wakili Eric</p><h2>Membership and matchday control center</h2></div>
          </div>
          <div className="top-actions">
            <label className="search">
              <Search size={16} />
              <input placeholder="Search members, fixtures, messages" />
            </label>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />{expiringSoon > 0 && <span />}
            </button>
          </div>
        </header>

        <section className="hero-panel">
          <div>
            <span className="eyebrow">Mt. Kenya Regional League</span>
            <h2>Mugutha Football Club</h2>
            <p>Keep supporters, members, and matchday operations moving from one calm dashboard.</p>
          </div>
          <div className="connection-pill">
            <MessageCircle size={16} />WhatsApp connected
          </div>
        </section>

        <section className="alert">
          <ShieldAlert size={19} />
          <p>
            {expiringSoon > 0
              ? `${expiringSoon} membership${expiringSoon > 1 ? 's' : ''} expire within 7 days. `
              : 'All memberships are up to date. '}
            <button onClick={() => openModal('all')}>Send renewal reminder</button>
          </p>
        </section>

        <section className="metrics-grid">
          <Metric icon={Users}        value={loading ? '…' : totalMembers}  label="Active members"     note="From live database"  tone="blue"  />
          <Metric icon={Megaphone}    value="312"                            label="Messages sent"      note="94.2% delivered"     tone="green" />
          <Metric icon={CalendarPlus} value="3"                              label="Fixtures this month"note="Next: Sun 29 Jun"    tone="sky"   />
          <Metric icon={Clock}        value={loading ? '…' : expiringSoon}   label="Expiring soon"      note="Within 7 days"       tone="red"   />
        </section>

        <section className="workspace-grid">
          <div className="panel">
            <div className="panel-head"><h3>Member tiers</h3><button>Import sheet</button></div>
            {[
              ['Gold',   goldCount,   goldWidth,   'gold'  ],
              ['Silver', silverCount, silverWidth, 'silver'],
              ['Bronze', bronzeCount, bronzeWidth, 'bronze'],
            ].map(([tier, count, width, tone]) => (
              <div className="tier" key={tier}>
                <div><span className={tone}>{tier}</span><strong>{loading ? '…' : count}</strong></div>
                <div className="bar"><i className={tone} style={{ width: `${width}%` }} /></div>
              </div>
            ))}
            <p className="muted">Annual contribution bands: Ksh 300 / 500 / 800</p>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Upcoming fixtures</h3><Trophy size={18} /></div>
            <div className="fixture-list">
              {FIXTURES.map(f => (
                <article key={f.date}>
                  <time>{f.date}</time>
                  <div><strong>{f.title}</strong><span>{f.meta}</span></div>
                  <button onClick={() => showToast(`Drafting alert for ${f.title}`)}>{f.action}</button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel broadcast-panel">
            <div className="panel-head"><h3>Recent broadcasts</h3><button>View all</button></div>
            <table>
              <thead><tr><th>Message</th><th>Audience</th><th>Sent</th><th>Status</th></tr></thead>
              <tbody>
                {BROADCASTS.map(b => (
                  <tr key={`${b.type}-${b.time}`}>
                    <td>{b.type}</td><td>{b.audience}</td><td>{b.time}</td>
                    <td><span className={`status ${b.status.toLowerCase()}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel actions-panel">
            <div className="panel-head"><h3>Quick actions</h3><Award size={18} /></div>
            <QuickAction icon={Trophy} title="Send matchday alert"  subtitle={`All ${totalMembers} active members`}    tone="blue" onClick={() => openModal('all')}    />
            <QuickAction icon={Bell}   title="Renewal reminders"    subtitle={`${expiringSoon} members expiring soon`} tone="red"  onClick={() => openModal('all')}    />
            <QuickAction icon={Award}  title="Gold tier broadcast"  subtitle={`${goldCount} premium supporters`}       tone="gold" onClick={() => openModal('gold')}   />
            <QuickAction icon={Upload} title="Import member sheet"  subtitle="Update from Excel"                       tone="sky"  onClick={() => showToast('Use the import script in /scripts')} />
          </div>
        </section>
      </main>

      <BroadcastModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSend={() => {
          setShowModal(false);
          showToast('Broadcast sent successfully!');
        }}
        tierCounts={{ total: totalMembers, gold: goldCount, silver: silverCount, bronze: bronzeCount }}
        preSelectedTier={modalTier}
      />

      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);