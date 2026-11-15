'use strict';

// Demo data, for showing the dashboard to other clubs without real fans' details.
//
// Everything created here is marked is_demo = true, so:
//  - "Clear demo data" removes exactly this and nothing else;
//  - match alerts, renewal reminders and broadcasts skip demo members
//    (unless ALERT_INCLUDE_DEMO=true AND WhatsApp is in mock mode).
// Demo phone numbers start with 2540..., which is not a real Kenyan mobile
// range, so a message can never reach a stranger by accident.

const supabase = require('../config/supabase');
const { TIERS } = require('../config/tiers');

const DAY_MS = 24 * 60 * 60 * 1000;

const FIRST = ['James', 'Mary', 'Peter', 'Grace', 'John', 'Faith', 'Joseph', 'Esther', 'David', 'Mercy', 'Samuel', 'Ann',
  'Daniel', 'Lucy', 'Stephen', 'Joyce', 'Paul', 'Ruth', 'Brian', 'Wanjiru', 'Kevin', 'Njeri', 'Dennis', 'Akinyi',
  'Collins', 'Wambui', 'Victor', 'Nyambura', 'Felix', 'Atieno', 'George', 'Muthoni', 'Allan', 'Chebet', 'Eric', 'Kemunto'];
const LAST = ['Kamau', 'Wanjiku', 'Otieno', 'Mwangi', 'Kiptoo', 'Njoroge', 'Achieng', 'Mutua', 'Karanja', 'Wafula',
  'Kariuki', 'Ochieng', 'Gitau', 'Mbugua', 'Cheruiyot', 'Ndungu', 'Omondi', 'Waweru'];
const OPPONENTS = ['Riverside Stars', 'Highland United', 'Coffee Estate FC', 'Railway Rangers', 'Valley Youth'];

// Same numbers every time, so a demo looks the same in every pitch.
function seeded(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function demoPeople(n = 36) {
  const rand = seeded(42);
  const tierPick = () => { const r = rand(); return r < 0.55 ? 'bronze' : r < 0.85 ? 'silver' : 'gold'; };
  return Array.from({ length: n }, (_, i) => {
    const tier = tierPick();
    // Most members joined in the last few months; a few are about to lapse or already have.
    const joinedDaysAgo = Math.floor(rand() * rand() * 330); // more recent joiners, like a growing club
    let expiresInDays = 365 - joinedDaysAgo;
    if (i % 9 === 0) expiresInDays = 1 + Math.floor(rand() * 6);   // ends this week
    if (i % 13 === 0) expiresInDays = -(5 + Math.floor(rand() * 20)); // already lapsed
    return {
      name: `${FIRST[i % FIRST.length]} ${LAST[Math.floor(rand() * LAST.length)]}`,
      phone: `2540${String(10000000 + i).slice(-8)}`,
      tier,
      joinedDaysAgo,
      expiresInDays,
      method: rand() < 0.7 ? 'mpesa' : 'cash',
      number: `DEMO-${String(i + 1).padStart(3, '0')}`,
    };
  });
}

async function clearDemo() {
  // Payments first (they point at members), then members, fixtures and broadcasts.
  const steps = [
    supabase.from('payments').delete().eq('is_demo', true),
    supabase.from('members').delete().eq('is_demo', true),
    supabase.from('fixtures').delete().eq('is_demo', true),
  ];
  for (const step of steps) {
    const { error } = await step;
    if (error) throw error;
  }
  return { cleared: true };
}

async function seedDemo() {
  await clearDemo();
  const now = Date.now();
  const iso = (days) => new Date(now + days * DAY_MS).toISOString();
  const people = demoPeople();

  const { data: members, error } = await supabase.from('members').insert(people.map((p) => ({
    name: p.name,
    phone: p.phone,
    tier: p.tier,
    membership_status: p.expiresInDays > 0 ? 'active' : 'expired',
    amount_paid: TIERS[p.tier].price,
    join_date: iso(-p.joinedDaysAgo).slice(0, 10),
    expires_at: iso(p.expiresInDays),
    member_number: p.number,
    is_demo: true,
  }))).select('id, phone');
  if (error) throw error;

  const idByPhone = Object.fromEntries(members.map((m) => [m.phone, m.id]));
  const { error: payError } = await supabase.from('payments').insert(people.map((p, i) => ({
    member_id: idByPhone[p.phone],
    phone: p.phone,
    name: p.name,
    tier: p.tier,
    amount: TIERS[p.tier].price,
    method: p.method,
    source: p.method === 'mpesa' ? 'whatsapp' : 'admin',
    status: 'paid',
    mpesa_receipt: p.method === 'mpesa' ? `DEMO${String(i + 1).padStart(6, '0')}` : null,
    recorded_by: p.method === 'cash' ? 'demo treasurer' : null,
    is_demo: true,
    created_at: iso(-p.joinedDaysAgo),
    paid_at: iso(-p.joinedDaysAgo),
  })));
  if (payError) throw payError;

  const club = process.env.CLUB_NAME || 'Mugutha FC';
  const ground = process.env.CLUB_GROUND_NAME ? `${process.env.CLUB_GROUND_NAME} Grounds` : 'Home Grounds';
  const day = (d) => new Date(now + d * DAY_MS).toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
  const { error: fxError } = await supabase.from('fixtures').insert([
    { home_team: club, away_team: OPPONENTS[0], venue: ground, date: day(-14), time: '15:00', competition: 'County League', status: 'completed', home_score: 2, away_score: 1, is_demo: true },
    { home_team: OPPONENTS[1], away_team: club, venue: `${OPPONENTS[1]} Stadium`, date: day(-7), time: '14:00', competition: 'County League', status: 'completed', home_score: 0, away_score: 0, is_demo: true },
    { home_team: club, away_team: OPPONENTS[2], venue: ground, date: day(3), time: '15:00', competition: 'County League', status: 'upcoming', is_demo: true },
    { home_team: OPPONENTS[3], away_team: club, venue: `${OPPONENTS[3]} Ground`, date: day(10), time: '15:00', competition: 'County League', status: 'upcoming', is_demo: true },
    { home_team: club, away_team: OPPONENTS[4], venue: ground, date: day(17), time: '11:00', competition: 'Cup', status: 'upcoming', is_demo: true },
  ]);
  if (fxError) throw fxError;

  return { members: people.length, payments: people.length, fixtures: 5 };
}

module.exports = { seedDemo, clearDemo, demoPeople };
