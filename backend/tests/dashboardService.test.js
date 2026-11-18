'use strict';

process.env.WHATSAPP_PROVIDER = 'mock';

jest.mock('../src/config/supabase', () => require('./helpers/supabaseMock').supabase);

const { db } = require('./helpers/supabaseMock');
const { getSummary } = require('../src/services/dashboardService');

describe('dashboard summary', () => {
  beforeEach(() => {
    db.reset();
  });

  test('calculates member, payment, message, fixture, and demo counts from query results', async () => {
    const now = Date.now();
    const iso = (offsetMs) => new Date(now + offsetMs).toISOString();
    db.seed('members', [
      { tier: 'gold', membership_status: 'active', expires_at: iso(5 * 24 * 60 * 60 * 1000), opted_out: false, is_demo: false },
      { tier: 'bronze', membership_status: 'active', expires_at: null, opted_out: true, is_demo: false },
      { tier: 'silver', membership_status: 'expired', expires_at: iso(-24 * 60 * 60 * 1000), opted_out: false, is_demo: false },
      { tier: 'bronze', membership_status: 'pending', expires_at: null, opted_out: false, is_demo: true },
    ]);
    db.seed('payments', [
      { amount: 2000, method: 'mpesa', status: 'paid', paid_at: iso(-24 * 60 * 60 * 1000), created_at: iso(-24 * 60 * 60 * 1000), is_demo: false },
      { amount: 500, method: 'cash', status: 'paid', paid_at: iso(-60 * 24 * 60 * 60 * 1000), created_at: iso(-60 * 24 * 60 * 60 * 1000), is_demo: false },
      { amount: 300, method: 'mpesa', status: 'pending', paid_at: null, created_at: iso(0), is_demo: true },
    ]);
    db.seed('messages', [
      { id: 'sent-1', status: 'sent', sent_at: iso(-2 * 24 * 60 * 60 * 1000) },
      { id: 'sent-2', status: 'sent', sent_at: iso(-3 * 24 * 60 * 60 * 1000) },
      { id: 'failed-1', status: 'failed', sent_at: iso(-4 * 24 * 60 * 60 * 1000) },
    ]);
    db.seed('fixtures', [
      { id: 'fixture-1', home_team: 'Mugutha FC', away_team: 'United', status: 'upcoming', date: iso(24 * 60 * 60 * 1000) },
    ]);
    db.seed('broadcasts', [
      { id: 'broadcast-1', title: 'Update', status: 'sent', created_at: iso(-1000) },
    ]);

    const summary = await getSummary();

    expect(summary.members).toMatchObject({
      active: 2,
      byTier: { gold: 1, silver: 0, bronze: 1 },
      endingIn7Days: 1,
      endingIn30Days: 1,
      lapsed: 1,
      optedOut: 1,
    });
    expect(summary.money).toMatchObject({
      last12MonthsKsh: 2500,
      thisMonthKsh: 2000,
      mpesaKsh: 2000,
      cashKsh: 500,
      paymentsThisMonth: 1,
      waitingForPin: 1,
    });
    expect(summary.messages).toEqual({ sent30Days: 2, failed30Days: 1, deliveredShare: 66.7 });
    expect(summary.fixtures.upcoming).toHaveLength(1);
    expect(summary.broadcasts).toHaveLength(1);
    expect(summary.demo).toEqual({ members: 1, payments: 1 });
  });
});
