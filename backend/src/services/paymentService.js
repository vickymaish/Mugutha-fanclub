'use strict';

// Join and pay: M-Pesa prompts, cash payments, confirming with Safaricom,
// activating the membership and telling the member.
//
// Money flow for M-Pesa:
//   startMpesaPayment -> payments row 'pending' + PIN prompt on the phone
//   Safaricom calls /mpesa/callback -> confirmCheckout asks Safaricom directly
//   (the callback could be faked) -> markPaid -> activateMembership -> notify
// If a callback never arrives, reconcilePendingPayments asks Safaricom every
// couple of minutes, so no paid member is ever left waiting.

const supabase = require('../config/supabase');
const { stkPush, stkQuery } = require('./mpesaService');
const { getTier, MEMBERSHIP_DAYS, formatKsh } = require('../config/tiers');
const { normalizeKenyanPhone } = require('../utils/phone');
const { sendMemberCard, formatDate, memberNumberFor } = require('./memberCardService');
const { sendMessage, sendClubTemplate } = require('./whatsappService');

const PENDING_TIMEOUT_MS = 15 * 60 * 1000;   // give up on a prompt after 15 minutes

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function cleanName(name) {
  const value = String(name || '').replace(/\s+/g, ' ').trim();
  return value.length >= 2 && value.length <= 40 ? value : null;
}

// ── Members ─────────────────────────────────────────────────────────────────

async function findMemberByPhone(phone) {
  const { data, error } = await supabase.from('members').select('*').eq('phone', phone).maybeSingle();
  if (error) throw error;
  return data;
}

/** Finds the member with this phone, or creates them as 'pending' until they pay. */
async function findOrCreateMember({ phone, name }) {
  const existing = await findMemberByPhone(phone);
  if (existing) {
    if (name && existing.name !== name && existing.membership_status !== 'active') {
      await supabase.from('members').update({ name }).eq('id', existing.id);
      existing.name = name;
    }
    return existing;
  }
  const { data, error } = await supabase.from('members')
    .insert([{ phone, name: name || 'Supporter', membership_status: 'pending' }])
    .select().single();
  if (error) {
    // Two requests at once: the other one created the member first.
    if (error.code === '23505') return findMemberByPhone(phone);
    throw error;
  }
  return data;
}

// ── Starting payments ───────────────────────────────────────────────────────

/** Sends an M-Pesa prompt for a tier. `source` is 'whatsapp', 'admin' or 'web'. */
async function startMpesaPayment({ phone, name, tier, source = 'admin', recordedBy = null }) {
  const msisdn = normalizeKenyanPhone(phone);
  if (!msisdn) throw fail('Enter a valid Safaricom number, e.g. 0712 345 678.');
  const plan = getTier(tier);
  if (!plan) throw fail('Choose Bronze, Silver or Gold.');
  const memberName = cleanName(name);

  const member = await findOrCreateMember({ phone: msisdn, name: memberName });

  // Don't send a second prompt while one is still waiting for the PIN.
  const { data: recent } = await supabase.from('payments').select('id')
    .eq('phone', msisdn).eq('status', 'pending').eq('method', 'mpesa')
    .gte('created_at', new Date(Date.now() - 60 * 1000).toISOString()).limit(1);
  if (recent && recent.length) throw fail('A payment prompt was just sent to this number. Please check the phone.', 429);

  const reply = await stkPush({ phone: msisdn, amount: plan.price, description: `${plan.label} member` });
  if (reply.ResponseCode !== '0' || !reply.CheckoutRequestID) {
    throw fail(reply.CustomerMessage || reply.ResponseDescription || 'M-Pesa did not accept the request.', 502);
  }

  const { data: payment, error } = await supabase.from('payments').insert([{
    member_id: member.id,
    phone: msisdn,
    name: memberName || member.name,
    tier: plan.key,
    amount: plan.price,
    method: 'mpesa',
    source,
    status: 'pending',
    checkout_request_id: reply.CheckoutRequestID,
    recorded_by: recordedBy,
  }]).select().single();
  if (error) throw error;

  return { payment, member, amount: plan.price, tier: plan };
}

/** Records cash collected by the treasurer and activates the membership straight away. */
async function recordCashPayment({ phone, name, tier, amount, recordedBy }) {
  const msisdn = normalizeKenyanPhone(phone);
  if (!msisdn) throw fail('Enter a valid phone number, e.g. 0712 345 678.');
  const plan = getTier(tier);
  if (!plan) throw fail('Choose Bronze, Silver or Gold.');
  const memberName = cleanName(name);
  if (!memberName) throw fail('Enter the member\'s name (2 to 40 letters).');
  const paid = amount === undefined || amount === '' ? plan.price : Number(amount);
  if (!Number.isInteger(paid) || paid < 1) throw fail('Enter the amount received in whole shillings.');

  const member = await findOrCreateMember({ phone: msisdn, name: memberName });
  const { data: payment, error } = await supabase.from('payments').insert([{
    member_id: member.id,
    phone: msisdn,
    name: memberName,
    tier: plan.key,
    amount: paid,
    method: 'cash',
    source: 'admin',
    status: 'paid',
    paid_at: new Date().toISOString(),
    recorded_by: recordedBy,
  }]).select().single();
  if (error) throw error;

  const activated = await activateMembership(payment);
  await notifyMember(payment, activated);
  return { payment, member: activated };
}

// ── Confirming M-Pesa payments ──────────────────────────────────────────────

/**
 * Applies Safaricom's verdict for one pending payment.
 * Only one caller can win the 'pending' -> 'paid' change, so a callback and the
 * background check arriving together never activate a member twice.
 */
async function applyResult(payment, { resultCode, resultDesc, receipt }) {
  if (Number(resultCode) === 0) {
    const { data: won, error } = await supabase.from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString(), mpesa_receipt: receipt || null, last_checked_at: new Date().toISOString() })
      .eq('id', payment.id).eq('status', 'pending')
      .select().maybeSingle();
    if (error && error.code === '23505') {
      // Same receipt used twice: never activate on a duplicate.
      await supabase.from('payments').update({ status: 'failed', failure_reason: 'Duplicate M-Pesa receipt' }).eq('id', payment.id).eq('status', 'pending');
      return 'failed';
    }
    if (error) throw error;
    if (!won) return 'already-handled';
    const member = await activateMembership(won);
    await notifyMember(won, member);
    return 'paid';
  }

  const { data: lost } = await supabase.from('payments')
    .update({ status: 'failed', failure_reason: String(resultDesc || 'Payment not completed').slice(0, 200), last_checked_at: new Date().toISOString() })
    .eq('id', payment.id).eq('status', 'pending')
    .select().maybeSingle();
  if (lost && lost.source === 'whatsapp') {
    await safeText(lost.phone, `The M-Pesa payment wasn't completed (${lost.failure_reason}). Reply JOIN to try again.`);
  }
  return 'failed';
}

/** Called by the M-Pesa callback: checks the result with Safaricom before acting on it. */
async function confirmCheckout(checkoutRequestId, callbackReceipt) {
  const { data: payment, error } = await supabase.from('payments').select('*')
    .eq('checkout_request_id', checkoutRequestId).maybeSingle();
  if (error) throw error;
  if (!payment || payment.status !== 'pending') return 'ignored';

  let verdict;
  try {
    verdict = await stkQuery(checkoutRequestId);
  } catch (err) {
    // Still processing at Safaricom: the background check will pick it up.
    await supabase.from('payments').update({ last_checked_at: new Date().toISOString() }).eq('id', payment.id);
    return 'pending';
  }
  return applyResult(payment, { resultCode: verdict.ResultCode, resultDesc: verdict.ResultDesc, receipt: callbackReceipt });
}

/** Background check for prompts whose callback never came. Runs every 2 minutes. */
async function reconcilePendingPayments() {
  const olderThan = new Date(Date.now() - 90 * 1000).toISOString();
  const { data: pending, error } = await supabase.from('payments').select('*')
    .eq('status', 'pending').eq('method', 'mpesa').lte('created_at', olderThan)
    .order('created_at', { ascending: true }).limit(20);
  if (error) throw error;

  const results = [];
  for (const payment of pending || []) {
    try {
      const verdict = await stkQuery(payment.checkout_request_id);
      results.push(await applyResult(payment, { resultCode: verdict.ResultCode, resultDesc: verdict.ResultDesc }));
    } catch (err) {
      if (Date.now() - new Date(payment.created_at).getTime() > PENDING_TIMEOUT_MS) {
        results.push(await applyResult(payment, { resultCode: 1, resultDesc: 'No response from M-Pesa' }));
      } else {
        await supabase.from('payments').update({ last_checked_at: new Date().toISOString() }).eq('id', payment.id);
        results.push('pending');
      }
    }
  }
  return results;
}

// ── Activating and notifying ────────────────────────────────────────────────

/** Makes the member active for a year from today, or from their current expiry if they renew early. */
async function activateMembership(payment) {
  const { data: member, error } = await supabase.from('members').select('*').eq('id', payment.member_id).single();
  if (error) throw error;

  const now = Date.now();
  const current = member.expires_at ? new Date(member.expires_at).getTime() : 0;
  const from = current > now ? current : now;
  const expiresAt = new Date(from + MEMBERSHIP_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const update = {
    tier: payment.tier,
    membership_status: 'active',
    expires_at: expiresAt,
    amount_paid: Number(member.amount_paid || 0) + payment.amount,
    updated_at: new Date().toISOString(),
  };
  if (payment.name && (!member.name || member.name === 'Supporter')) update.name = payment.name;
  if (!member.member_number) {
    const { data: number } = await supabase.rpc('next_member_number');
    if (number) update.member_number = number;
  }

  const { data: updated, error: updateError } = await supabase.from('members')
    .update(update).eq('id', member.id).select().single();
  if (updateError) throw updateError;
  return updated;
}

async function safeText(phone, message) {
  try { await sendMessage({ phone, message }); } catch (err) { console.error('WhatsApp text failed:', err.message); }
}

/**
 * Tells the member they're in.
 * - Joined on WhatsApp just now: their chat is open, so send the card directly.
 * - Cash or admin: their chat may be closed, so send approved templates
 *   (receipt + welcome with a "Get my card" button); fall back to plain text.
 */
async function notifyMember(payment, member) {
  const tier = getTier(payment.tier);
  const expires = formatDate(member.expires_at);
  const number = memberNumberFor(member);

  try {
    if (payment.source === 'whatsapp') {
      await sendMemberCard(member);
      return;
    }
    await sendClubTemplate({
      phone: member.phone, memberId: member.id, name: 'payment_receipt',
      values: { name: member.name, amount: formatKsh(payment.amount), item: `${tier.label} membership`, reference: payment.mpesa_receipt || 'Cash' },
    });
    await sendClubTemplate({
      phone: member.phone, memberId: member.id, name: 'membership_welcome',
      values: { name: member.name, tier: tier.label, expires, memberNumber: number },
    });
  } catch (err) {
    console.error('Template send failed, falling back to text:', err.response?.data?.error?.message || err.message);
    await safeText(member.phone,
      `Payment received, thank you ${member.name}. Your ${tier.label} membership is active until ${expires}. ` +
      `Member number: ${number}. Reply CARD to get your member card.`);
  }
}

// ── Admin views ─────────────────────────────────────────────────────────────

async function listPayments({ limit = 50 } = {}) {
  const { data, error } = await supabase.from('payments')
    .select('id,name,phone,tier,amount,method,source,status,mpesa_receipt,failure_reason,recorded_by,created_at,paid_at,is_demo')
    .order('created_at', { ascending: false }).limit(Math.min(Number(limit) || 50, 200));
  if (error) throw error;
  return data;
}

module.exports = {
  startMpesaPayment,
  recordCashPayment,
  confirmCheckout,
  reconcilePendingPayments,
  activateMembership,
  findMemberByPhone,
  listPayments,
  cleanName,
};
