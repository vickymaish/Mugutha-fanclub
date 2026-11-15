'use strict';

// Renewal reminders and expiry.
//
// - 7 days before a membership ends, and again 1 day before, the member gets the
//   approved "renewal_reminder" template with a "Renew now" button. Tapping it
//   starts the normal join flow (choose tier -> M-Pesa prompt), and paying
//   extends their membership from the old expiry date (see paymentService).
// - Each reminder is sent once per expiry date (columns reminder_7d_for and
//   reminder_1d_for), so a renewed member gets reminders again next year.
// - Once a membership has ended, markExpiredMembers() sets it to 'expired'.

const supabase = require('../config/supabase');
const { getExpiringMembers } = require('../models/supabaseQueries');
const { getTier, TIERS, formatKsh } = require('../config/tiers');
const { sendClubTemplate } = require('./whatsappService');

const DAY_MS = 24 * 60 * 60 * 1000;
const TIMEZONE = 'Africa/Nairobi';
const SEND_GAP_MS = 120;
// Demo members (fake 2540... numbers) only get messages in mock mode, and only if asked.
function includeDemo() {
  return process.env.ALERT_INCLUDE_DEMO === 'true' && (process.env.WHATSAPP_PROVIDER || 'mock') === 'mock';
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-GB', { timeZone: TIMEZONE, day: 'numeric', month: 'short', year: 'numeric' });
}

/** Which reminder (if any) is due for this member right now: '7d', '1d' or null. */
function reminderDue(member, now = Date.now()) {
  if (!member.expires_at) return null;
  const expires = new Date(member.expires_at).getTime();
  const left = expires - now;
  if (left <= 0) return null;
  const sentFor = (column) => member[column] && new Date(member[column]).getTime() === expires;
  if (left <= DAY_MS) return sentFor('reminder_1d_for') ? null : '1d';
  if (left <= 7 * DAY_MS) return sentFor('reminder_7d_for') || sentFor('reminder_1d_for') ? null : '7d';
  return null;
}

async function membersEndingWithin(days) {
  const now = new Date();
  let query = supabase.from('members')
    .select('id, name, phone, tier, expires_at, reminder_7d_for, reminder_1d_for')
    .eq('membership_status', 'active')
    .eq('opted_out', false)
    .gt('expires_at', now.toISOString())
    .lte('expires_at', new Date(now.getTime() + days * DAY_MS).toISOString());
  if (!includeDemo()) query = query.eq('is_demo', false);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/** Sends every reminder that is due. Returns { sent, failed }. */
async function sendRenewalReminders() {
  const members = await membersEndingWithin(7);
  let sent = 0;
  let failed = 0;

  for (const member of members) {
    const due = reminderDue(member);
    if (!due || !member.phone) continue;
    const tier = getTier(member.tier) || { key: 'bronze', ...TIERS.bronze };
    const column = due === '1d' ? 'reminder_1d_for' : 'reminder_7d_for';

    // Mark first so a crash or restart never sends the same reminder twice.
    const { error } = await supabase.from('members').update({ [column]: member.expires_at }).eq('id', member.id);
    if (error) { console.error('Could not mark reminder:', error.message); continue; }

    try {
      await sendClubTemplate({
        phone: member.phone,
        memberId: member.id,
        name: 'renewal_reminder',
        values: {
          name: String(member.name || 'supporter').split(/\s+/)[0],
          tier: tier.label,
          expires: formatDate(member.expires_at),
          amount: formatKsh(tier.price),
        },
      });
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error(`Renewal reminder to ${member.phone} failed:`, err.response?.data?.error?.message || err.message);
    }
    await sleep(SEND_GAP_MS);
  }

  if (sent || failed) console.log(`Renewal reminders: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

/** Sets memberships whose end date has passed to 'expired'. Returns how many changed. */
async function markExpiredMembers() {
  const { data, error } = await supabase.from('members')
    .update({ membership_status: 'expired', updated_at: new Date().toISOString() })
    .eq('membership_status', 'active')
    .lt('expires_at', new Date().toISOString())
    .select('id');
  if (error) throw error;
  if (data?.length) console.log(`Marked ${data.length} membership(s) as expired`);
  return data?.length || 0;
}

/** Members ending within `days`, for the dashboard. */
async function listRenewalsDue(days = 30) {
  return membersEndingWithin(days);
}

module.exports = { sendRenewalReminders, markExpiredMembers, listRenewalsDue, reminderDue, getExpiringMembers };
