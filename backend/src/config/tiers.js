'use strict';

// Membership tiers. Prices are placeholders until the club confirms them:
// override in backend/.env with TIER_PRICE_BRONZE, TIER_PRICE_SILVER, TIER_PRICE_GOLD.
// The server always uses these prices: a fan can't choose their own amount.

const MEMBERSHIP_DAYS = Number(process.env.MEMBERSHIP_DAYS) || 365;

function price(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

const TIERS = {
  bronze: { label: 'Bronze', price: price('TIER_PRICE_BRONZE', 500), perks: 'Match alerts and member card' },
  silver: { label: 'Silver', price: price('TIER_PRICE_SILVER', 1000), perks: 'Plus team news and polls' },
  gold: { label: 'Gold', price: price('TIER_PRICE_GOLD', 2000), perks: "Plus your name on the supporters' wall" },
};

function getTier(key) {
  return TIERS[String(key || '').toLowerCase()] ? { key: String(key).toLowerCase(), ...TIERS[String(key).toLowerCase()] } : null;
}

function formatKsh(amount) {
  return Number(amount).toLocaleString('en-KE');
}

module.exports = { TIERS, MEMBERSHIP_DAYS, getTier, formatKsh };
