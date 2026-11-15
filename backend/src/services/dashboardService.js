'use strict';

// One call that gives the dashboard its numbers: members by tier, money in,
// renewals due, messages sent, the next match and recent broadcasts.

const supabase = require('../config/supabase');
const { TIERS } = require('../config/tiers');

const DAY_MS = 24 * 60 * 60 * 1000;

async function rows(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function count(query) {
  const { count: n, error } = await query;
  if (error) throw error;
  return n || 0;
}

function startOfMonthNairobi(now = new Date()) {
  const [y, m] = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' }).split('-');
  return new Date(`${y}-${m}-01T00:00:00+03:00`);
}

async function getSummary() {
  const now = new Date();
  const monthStart = startOfMonthNairobi(now);
  const yearAgo = new Date(now.getTime() - 365 * DAY_MS);
  const monthAgo = new Date(now.getTime() - 30 * DAY_MS);

  const [members, payments, sent30d, failed30d, fixtures, broadcasts] = await Promise.all([
    rows(supabase.from('members').select('tier, membership_status, expires_at, opted_out, is_demo')),
    rows(supabase.from('payments').select('amount, method, status, paid_at, created_at, is_demo')
      .or(`paid_at.gte.${yearAgo.toISOString()},status.eq.pending`)),
    count(supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'sent').gte('sent_at', monthAgo.toISOString())),
    count(supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('sent_at', monthAgo.toISOString())),
    rows(supabase.from('fixtures').select('id, home_team, away_team, venue, date, time, status').eq('status', 'upcoming').order('date', { ascending: true }).limit(5)),
    rows(supabase.from('broadcasts').select('id, title, message, tier, status, sent_at, scheduled_for, created_at').order('created_at', { ascending: false }).limit(5)),
  ]);

  const isActive = (m) => m.membership_status === 'active' && (!m.expires_at || new Date(m.expires_at) > now);
  const active = members.filter(isActive);
  const byTier = Object.fromEntries(Object.keys(TIERS).map((key) => [key, active.filter((m) => m.tier === key).length]));
  const endingWithin = (days) => active.filter((m) => m.expires_at && new Date(m.expires_at) - now <= days * DAY_MS).length;

  const paid = payments.filter((p) => p.status === 'paid');
  const sum = (list) => list.reduce((total, p) => total + Number(p.amount || 0), 0);
  const paidThisMonth = paid.filter((p) => p.paid_at && new Date(p.paid_at) >= monthStart);

  return {
    members: {
      active: active.length,
      byTier,
      endingIn7Days: endingWithin(7),
      endingIn30Days: endingWithin(30),
      lapsed: members.filter((m) => !isActive(m) && m.expires_at).length,
      optedOut: active.filter((m) => m.opted_out).length,
    },
    money: {
      last12MonthsKsh: sum(paid),
      thisMonthKsh: sum(paidThisMonth),
      mpesaKsh: sum(paid.filter((p) => p.method === 'mpesa')),
      cashKsh: sum(paid.filter((p) => p.method === 'cash')),
      paymentsThisMonth: paidThisMonth.length,
      waitingForPin: payments.filter((p) => p.status === 'pending').length,
    },
    messages: {
      sent30Days: sent30d,
      failed30Days: failed30d,
      deliveredShare: sent30d + failed30d ? Math.round((sent30d / (sent30d + failed30d)) * 1000) / 10 : null,
    },
    fixtures: { upcoming: fixtures },
    broadcasts,
    tiers: Object.entries(TIERS).map(([key, t]) => ({ key, label: t.label, price: t.price })),
    club: {
      name: process.env.CLUB_NAME || 'Mugutha FC',
      league: process.env.CLUB_LEAGUE || '',
    },
    whatsapp: { mode: (process.env.WHATSAPP_PROVIDER || 'mock') === 'meta' ? 'live' : 'test' },
    demo: {
      members: members.filter((m) => m.is_demo).length,
      payments: payments.filter((p) => p.is_demo).length,
    },
  };
}

module.exports = { getSummary };
