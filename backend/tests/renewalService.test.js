'use strict';

process.env.WHATSAPP_PROVIDER = 'mock';
process.env.ALERT_INCLUDE_DEMO = 'false';

jest.mock('../src/config/supabase', () => require('./helpers/supabaseMock').supabase);
jest.mock('../src/models/supabaseQueries', () => ({
  getExpiringMembers: jest.fn(),
}));
jest.mock('../src/services/whatsappService', () => ({
  sendClubTemplate: jest.fn().mockResolvedValue(undefined),
}));

const { db } = require('./helpers/supabaseMock');
const { sendClubTemplate } = require('../src/services/whatsappService');
const {
  sendRenewalReminders,
  markExpiredMembers,
  listRenewalsDue,
} = require('../src/services/renewalService');

const DAY_MS = 24 * 60 * 60 * 1000;

describe('membership renewal reminders and expiry', () => {
  beforeEach(() => {
    db.reset();
    jest.clearAllMocks();
  });

  test('sends the 7-day and 1-day reminders once for each expiry date', async () => {
    const expires7d = new Date(Date.now() + 6 * DAY_MS).toISOString();
    const expires1d = new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString();
    db.seed('members', [
      {
        id: 'member-7d',
        name: 'Seven Day',
        phone: '254700000007',
        tier: 'bronze',
        membership_status: 'active',
        opted_out: false,
        is_demo: false,
        expires_at: expires7d,
      },
      {
        id: 'member-1d',
        name: 'One Day',
        phone: '254700000001',
        tier: 'silver',
        membership_status: 'active',
        opted_out: false,
        is_demo: false,
        expires_at: expires1d,
      },
    ]);

    await expect(sendRenewalReminders()).resolves.toEqual({ sent: 2, failed: 0 });
    await expect(sendRenewalReminders()).resolves.toEqual({ sent: 0, failed: 0 });

    expect(sendClubTemplate).toHaveBeenCalledTimes(2);
    expect(sendClubTemplate.mock.calls.map(([message]) => message.phone).sort()).toEqual([
      '254700000001',
      '254700000007',
    ]);
    expect(db.rows('members')[0].reminder_7d_for).toBe(expires7d);
    expect(db.rows('members')[1].reminder_1d_for).toBe(expires1d);
  });

  test('marks only active members whose expiry has passed as expired', async () => {
    db.seed('members', [
      { id: 'past', membership_status: 'active', expires_at: new Date(Date.now() - DAY_MS).toISOString() },
      { id: 'future', membership_status: 'active', expires_at: new Date(Date.now() + DAY_MS).toISOString() },
      { id: 'already-expired', membership_status: 'expired', expires_at: new Date(Date.now() - DAY_MS).toISOString() },
    ]);

    await expect(markExpiredMembers()).resolves.toBe(1);

    expect(db.rows('members').map((member) => member.membership_status)).toEqual([
      'expired',
      'active',
      'expired',
    ]);
  });

  test('lists only eligible active members whose expiry is within the requested days', async () => {
    db.seed('members', [
      { id: 'due', membership_status: 'active', opted_out: false, is_demo: false, expires_at: new Date(Date.now() + 5 * DAY_MS).toISOString() },
      { id: 'not-due', membership_status: 'active', opted_out: false, is_demo: false, expires_at: new Date(Date.now() + 31 * DAY_MS).toISOString() },
      { id: 'opted-out', membership_status: 'active', opted_out: true, is_demo: false, expires_at: new Date(Date.now() + 5 * DAY_MS).toISOString() },
      { id: 'demo', membership_status: 'active', opted_out: false, is_demo: true, expires_at: new Date(Date.now() + 5 * DAY_MS).toISOString() },
    ]);

    await expect(listRenewalsDue(30)).resolves.toMatchObject([{ id: 'due' }]);
  });
});
