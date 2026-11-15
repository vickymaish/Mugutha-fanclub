'use strict';

// Builds a member's card (masterplate + name + expiry) and sends it on WhatsApp.
// Used when a payment succeeds, when a fan taps "Get my card", and by the admin's
// "Send card" button.

const path = require('path');
const { generateMemberCard } = require('./imageService');
const { uploadImage, sendImage } = require('./mediaService');

const MASTERPLATES = {
  gold: path.join(__dirname, '..', '..', 'assets', 'masterplate-gold.jpg'),
  silver: path.join(__dirname, '..', '..', 'assets', 'masterplate-silver.jpg'),
  bronze: path.join(__dirname, '..', '..', 'assets', 'masterplate-bronze.jpg'),
};

/** "2027-11-14T..." -> "11/27". */
function formatExpiry(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
}

/** "2027-11-14T..." -> "14 Nov 2027". */
function formatDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi' });
}

function memberNumberFor(member) {
  return member.member_number || `MFC-${String(member.id || '').slice(0, 6).toUpperCase()}`;
}

/** Sends the card image. Only delivers if the member messaged the club in the last 24 hours. */
async function sendMemberCard(member, { caption } = {}) {
  const tier = String(member.tier || 'bronze').toLowerCase();
  const masterplatePath = MASTERPLATES[tier];
  if (!masterplatePath) throw new Error(`Unknown tier: ${tier}`);
  if (!member.phone) throw new Error('Member has no phone number');

  const image = await generateMemberCard({
    masterplatePath,
    name: member.name,
    tier,
    expires: formatExpiry(member.expires_at),
  });
  const mediaId = await uploadImage(image);
  const tierLabel = { gold: '🏆 Gold', silver: '🥈 Silver', bronze: '🥉 Bronze' }[tier];
  const text = caption || `Welcome ${member.name}!\n\nYour ${tierLabel} membership is active` +
    (member.expires_at ? ` until ${formatDate(member.expires_at)}` : '') +
    `.\nMember number: ${memberNumberFor(member)}`;
  return sendImage(member.phone, mediaId, text);
}

module.exports = { sendMemberCard, formatExpiry, formatDate, memberNumberFor };
