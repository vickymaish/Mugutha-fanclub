'use strict';

// M-Pesa Daraja: STK push (the PIN prompt on the fan's phone) and status check.
// Reused from BingwaConnect, where it's tested in production.
//
// backend/.env:
//   MPESA_ENV=sandbox                     (or production after Daraja Go Live)
//   MPESA_SANDBOX_CONSUMER_KEY=...        MPESA_SANDBOX_CONSUMER_SECRET=...
//   MPESA_PRODUCTION_CONSUMER_KEY=...     MPESA_PRODUCTION_CONSUMER_SECRET=...
//   MPESA_SHORTCODE=174379                (sandbox paybill; the club's own number when live)
//   MPESA_PASSKEY=...                     (sandbox passkey from the Daraja portal)
//   MPESA_CALLBACK_URL=https://<your-backend>/mpesa/callback
//   MPESA_TILL_NUMBER=                    (only for a Buy Goods till; leave empty for a paybill)
//   MPESA_ACCOUNT_REFERENCE=MUGUTHA FC    (what fans see as the account, max 12 characters)

const axios = require('axios');

const isProduction = process.env.MPESA_ENV === 'production';
const baseUrl = isProduction ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`M-Pesa is not set up: ${name} is missing in backend/.env`);
    error.code = 'MPESA_CONFIG_ERROR';
    throw error;
  }
  return value;
}

// Daraja tokens last about an hour. Cache one so every request doesn't fetch a new one.
let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) return cachedToken;
  const prefix = isProduction ? 'MPESA_PRODUCTION' : 'MPESA_SANDBOX';
  const credentials = Buffer.from(
    `${requiredEnv(`${prefix}_CONSUMER_KEY`)}:${requiredEnv(`${prefix}_CONSUMER_SECRET`)}`
  ).toString('base64');
  const response = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }, timeout: 15000,
  });
  const expiresIn = Number(response.data.expires_in) || 3599;
  cachedToken = response.data.access_token;
  cachedTokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;
  return cachedToken;
}

function darajaTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).reduce((acc, part) => { acc[part.type] = part.value; return acc; }, {});
  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
}

function stkCredentials() {
  const shortcode = requiredEnv('MPESA_SHORTCODE');
  const passkey = requiredEnv('MPESA_PASSKEY');
  const timestamp = darajaTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  return { shortcode, timestamp, password };
}

function callbackUrl() {
  const url = requiredEnv('MPESA_CALLBACK_URL');
  let parsed;
  try { parsed = new URL(url); } catch (_) { /* invalid */ }
  if (!parsed || parsed.protocol !== 'https:' || /^(localhost|127\.0\.0\.1)$/.test(parsed.hostname)) {
    const error = new Error('MPESA_CALLBACK_URL must be a public https address ending in /mpesa/callback (use ngrok when testing locally).');
    error.code = 'MPESA_CONFIG_ERROR';
    throw error;
  }
  return url;
}

/** Sends the PIN prompt to `phone` (2547XXXXXXXX). Returns Daraja's reply, incl. CheckoutRequestID. */
async function stkPush({ phone, amount, accountReference, description }) {
  if (!Number.isInteger(amount) || amount < 1) throw new Error('Invalid payment amount');
  const url = callbackUrl();
  const { shortcode, timestamp, password } = stkCredentials();
  const till = (process.env.MPESA_TILL_NUMBER || '').trim();
  const token = await getAccessToken();

  const response = await axios.post(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: till ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phone,
    PartyB: till || shortcode,
    PhoneNumber: phone,
    CallBackURL: url,
    AccountReference: String(accountReference || process.env.MPESA_ACCOUNT_REFERENCE || 'MUGUTHA FC').slice(0, 12),
    TransactionDesc: String(description || 'Membership').slice(0, 13),
  }, { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 });

  return response.data;
}

/**
 * Asks Safaricom directly what happened to a prompt. The callback URL is public,
 * so a callback could be faked; this answer can't be.
 * Returns { ResultCode, ResultDesc } once final. Throws while it's still being processed.
 */
async function stkQuery(checkoutRequestId) {
  const { shortcode, timestamp, password } = stkCredentials();
  const token = await getAccessToken();
  const response = await axios.post(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  }, { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 });
  return response.data;
}

module.exports = { stkPush, stkQuery };
