'use strict';

/**
 * Turns any Kenyan mobile format into 2547XXXXXXXX / 2541XXXXXXXX
 * (what M-Pesa and WhatsApp use). Returns null if it isn't a valid number.
 *   "0712 345 678" "+254712345678" "712345678" -> "254712345678"
 */
function normalizeKenyanPhone(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '254' + digits.slice(1);
  else if (/^[71]\d{8}$/.test(digits)) digits = '254' + digits;
  return /^254[71]\d{8}$/.test(digits) ? digits : null;
}

/** "254712345678" -> "0712 345 678" for messages. */
function displayPhone(phone) {
  const p = normalizeKenyanPhone(phone);
  return p ? `0${p.slice(3, 6)} ${p.slice(6, 9)} ${p.slice(9)}` : String(phone || '');
}

module.exports = { normalizeKenyanPhone, displayPhone };
