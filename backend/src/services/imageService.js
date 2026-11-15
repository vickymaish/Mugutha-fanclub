const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// ── Tier styling ───────────────────────────────────────────────────────────
const TIER_CONFIG = {
  gold:   { color: '#D4AF37' },
  silver: { color: '#C0C0C0' },
  bronze: { color: '#CD7F32' },
};

// ── SVG overlay builder ────────────────────────────────────────────────────
// Positions are fractions of the masterplate image (1193 x 896). The card sits
// in the middle of the image; its dark band runs from about 50% to 59% down.
function buildOverlaySVG({ name, tier, expires, width, height }) {
  const tierCfg = TIER_CONFIG[tier?.toLowerCase()] || TIER_CONFIG.gold;

  const cx = Math.round(0.491 * width);          // horizontal centre of the card
  const nameY = Math.round(0.552 * height);       // inside the dark band
  const nameSize = Math.round(0.036 * height);
  const expiryY = Math.round(0.70 * height);      // lower panel, under the band
  const expirySize = Math.round(0.017 * height);

  const displayName = String(name || '').toUpperCase().slice(0, 26);
  // Long names get a slightly smaller font so they stay inside the card.
  const fitted = displayName.length > 16 ? Math.round(nameSize * 16 / displayName.length) : nameSize;

  const expiryLine = expires
    ? `<text x="${cx}" y="${expiryY}" font-family="Arial, Helvetica, sans-serif" font-size="${expirySize}"
        font-weight="600" letter-spacing="${Math.round(expirySize * 0.25)}" fill="#9AA3AD" text-anchor="middle">VALID THRU ${esc(expires)}</text>`
    : '';

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <text x="${cx}" y="${nameY}" dominant-baseline="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="${fitted}" font-weight="bold"
        letter-spacing="${Math.round(fitted * 0.08)}" fill="${tierCfg.color}"
        text-anchor="middle" filter="url(#glow)">${esc(displayName)}</text>
  ${expiryLine}
</svg>`.trim();
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── Main export ────────────────────────────────────────────────────────────

async function generateMemberCard({ masterplatePath, name, tier, expires }) {
  const absPath = path.resolve(masterplatePath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`Masterplate not found: ${absPath}`);
  }

  const meta = await sharp(absPath).metadata();
  const { width, height } = meta;

  const svg = buildOverlaySVG({ name, tier, expires, width, height });
  const svgBuffer = Buffer.from(svg);

  const outputBuffer = await sharp(absPath)
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .jpeg({ quality: 90 }) // uploaded to WhatsApp as image/jpeg
    .toBuffer();

  return outputBuffer;
}

module.exports = { generateMemberCard };