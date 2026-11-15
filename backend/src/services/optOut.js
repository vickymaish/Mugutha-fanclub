'use strict';

// STOP / START. Every alert and reminder template ends with
// "Reply STOP to stop these messages", so we must honour it: WhatsApp can
// restrict numbers that keep messaging people who asked them to stop.
//
// STOP  -> no more match alerts, renewal reminders or broadcasts.
// START -> turns them back on.
// Messages the member asks for (CARD, JOIN, the menu) still work after STOP.

const supabase = require('../config/supabase');
const { sendMessage } = require('./whatsappService');

const STOP_WORDS = /^(stop|stop all|unsubscribe|opt out|optout|sitaki)$/i;
const START_WORDS = /^(start|unstop|subscribe|opt in|optin|anza)$/i;

async function setOptOut(phone, optedOut) {
  const { data, error } = await supabase.from('members')
    .update({ opted_out: optedOut, opted_out_at: optedOut ? new Date().toISOString() : null })
    .eq('phone', phone)
    .select('id');
  if (error) throw error;
  return (data || []).length > 0;
}

async function reply(phone, message) {
  try { await sendMessage({ phone, message }); } catch (err) { console.error('Opt-out reply failed:', err.message); }
}

/** Handles STOP / START. Returns true when the message was one of them. */
async function handle({ from, text }) {
  const message = String(text || '').trim();

  if (STOP_WORDS.test(message)) {
    try { await setOptOut(from, true); } catch (err) { console.error('Could not save STOP:', err.message); }
    await reply(from, "Done. You won't get match alerts, renewal reminders or club updates any more. Reply START to turn them back on.");
    return true;
  }

  if (START_WORDS.test(message)) {
    let member = false;
    try { member = await setOptOut(from, false); } catch (err) { console.error('Could not save START:', err.message); }
    await reply(from, member
      ? "Welcome back! You'll get match alerts and club updates again."
      : "You're not a member yet. Reply JOIN to become one and get match alerts.");
    return true;
  }

  return false;
}

module.exports = { handle, STOP_WORDS, START_WORDS };
