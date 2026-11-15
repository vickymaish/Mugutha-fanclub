'use strict';

// The WhatsApp join conversation:
//   fan: JOIN        -> bot: list of tiers (tap one)
//   fan: taps Gold   -> bot: "What name should go on your card?" (skipped if we know it)
//   fan: James M.    -> M-Pesa PIN prompt on their phone
//   paid             -> paymentService sends their member card here
// Also: CARD / "Get my card" sends an active member their card again.
//
// Conversation state lives in memory for 15 minutes. If the server restarts mid-way,
// the fan just types JOIN again.

const { TIERS, formatKsh } = require('../config/tiers');
const { displayPhone } = require('../utils/phone');
const { sendMessage, sendList } = require('./whatsappService');
const { startMpesaPayment, findMemberByPhone, cleanName } = require('./paymentService');
const { sendMemberCard } = require('./memberCardService');

const STATE_TTL_MS = 15 * 60 * 1000;
const states = new Map();

const JOIN_WORDS = /^(join|jiunge|register|renew|renew now|join the club|become a member|nataka kujiunga)$/i;
const CARD_WORDS = /^(card|get my card|my card|kadi|kadi yangu)$/i;
// (STOP is handled by optOut.js: it turns off alerts and reminders.)
const CANCEL_WORDS = /^(cancel|acha|menu)$/i;

function getState(phone) {
  const state = states.get(phone);
  if (state && Date.now() - state.at < STATE_TTL_MS) return state;
  states.delete(phone);
  return null;
}

function setState(phone, state) {
  states.set(phone, { ...state, at: Date.now() });
}

async function reply(phone, message) {
  try { await sendMessage({ phone, message }); } catch (err) { console.error('Reply failed:', err.message); }
}

async function offerTiers(phone) {
  setState(phone, { step: 'choose_tier' });
  await sendList({
    phone,
    header: 'Join Mugutha FC',
    body: 'Choose your supporter tier. You back the club for the whole season and get your member card here on WhatsApp.',
    button: 'Choose a tier',
    rows: Object.entries(TIERS).map(([key, t]) => ({ id: `tier_${key}`, title: `${t.label} · KSh ${formatKsh(t.price)}`, description: t.perks })),
  });
}

function tierFrom(text, replyId) {
  if (replyId && replyId.startsWith('tier_')) return replyId.slice(5);
  const word = String(text || '').toLowerCase();
  return Object.keys(TIERS).find((key) => word.startsWith(key)) || null;
}

async function askForPayment(phone, tier, name) {
  states.delete(phone);
  try {
    const { amount, tier: plan } = await startMpesaPayment({ phone, name, tier, source: 'whatsapp' });
    await reply(phone,
      `We've sent an M-Pesa prompt to ${displayPhone(phone)} for KSh ${formatKsh(amount)} (${plan.label}).\n\n` +
      'Enter your M-Pesa PIN to finish. Your member card will arrive here as soon as the payment goes through.');
  } catch (err) {
    console.error('Join payment failed:', err.message);
    const message = err.status && err.status < 500 ? err.message : 'We could not send the M-Pesa prompt right now.';
    await reply(phone, `${message}\n\nReply JOIN to try again.`);
  }
}

/**
 * Handles the message if it belongs to the join or card conversation.
 * Returns true when handled, so the normal menu bot doesn't reply as well.
 */
async function handle({ from, text, replyId }) {
  const message = String(text || '').trim();
  const state = getState(from);

  if (CARD_WORDS.test(message) || replyId === 'get_card') {
    const member = await findMemberByPhone(from);
    const active = member && member.membership_status === 'active' && (!member.expires_at || new Date(member.expires_at) > new Date());
    if (!active) {
      await reply(from, "You don't have an active membership yet. Reply JOIN to become a member.");
    } else {
      try { await sendMemberCard(member); } catch (err) {
        console.error('Card send failed:', err.message);
        await reply(from, "Sorry, we couldn't create your card just now. Please try again in a few minutes.");
      }
    }
    return true;
  }

  if (JOIN_WORDS.test(message) || replyId === 'join') {
    await offerTiers(from);
    return true;
  }

  if (!state) return false;

  if (CANCEL_WORDS.test(message)) {
    states.delete(from);
    return false; // let the normal bot show the menu
  }

  if (state.step === 'choose_tier') {
    const tier = tierFrom(message, replyId);
    if (!tier) {
      await reply(from, 'Please tap "Choose a tier" and pick Bronze, Silver or Gold. Reply CANCEL to stop.');
      return true;
    }
    const member = await findMemberByPhone(from);
    if (member && member.name && member.name !== 'Supporter') {
      await askForPayment(from, tier, member.name);
    } else {
      setState(from, { step: 'ask_name', tier });
      await reply(from, 'What name should we print on your member card? (For example: James Mwangi)');
    }
    return true;
  }

  if (state.step === 'ask_name') {
    const name = cleanName(message);
    if (!name || !/^[\p{L}][\p{L}' .-]*$/u.test(name)) {
      await reply(from, 'Please send just your name, 2 to 40 letters, as you want it on the card. Reply CANCEL to stop.');
      return true;
    }
    await askForPayment(from, state.tier, name);
    return true;
  }

  return false;
}

module.exports = { handle };
