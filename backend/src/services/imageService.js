// backend/src/services/imageService.js
//
// Dynamically overlays member info onto a masterplate image.
// Uses `sharp` — install with: npm install sharp
//
// Usage:
//   const { generateMemberCard } = require('./imageService');
//   const imgBuffer = await generateMemberCard({
//     masterplatePath: 'assets/masterplate-gold.jpg',
//     name: 'VICTOR OMONDI',
//     tier: 'PREMIUM MEMBER',
//     memberId: 'MFC-2026-001',
//   });
//   // imgBuffer is a Buffer — send directly via WhatsApp media API

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// ── Tier config ────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  gold:   { label: 'GOLD MEMBER',   color: '#C8972A' },
  silver: { label: 'SILVER MEMBER', color: '#888780' },
  bronze: { label: 'BRONZE MEMBER', color: '#D85A30' },
};

// ── SVG text overlay builder ───────────────────────────────────────────────
// We use SVG as the overlay because sharp supports it natively —
// no canvas, no extra native bindings, works on Linux/Windows/Render.
function buildOverlaySVG({ name, tier, memberId, width = 1456, height = 816 }) {
  const tierCfg = TIER_CONFIG[tier?.toLowerCase()] || TIER_CONFIG.bronze;

  // Bottom-left card — matches the style in your branded.png screenshot
  const cardX = 60;
  const cardY = height - 160;
  const cardW = 600;
  const cardH = 100;

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
  </defs>

  <!-- Semi-transparent card background -->
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}"
        rx="8" ry="8"
        fill="rgba(0,0,0,0.72)"
        filter="url(#shadow)" />

  <!-- Tier badge circle -->
  <circle cx="${cardX + 44}" cy="${cardY + 50}" r="34"
          fill="${tierCfg.color}" />
  <text x="${cardX + 44}" y="${cardY + 44}"
        font-family="Arial" font-size="9" font-weight="bold"
        fill="white" text-anchor="middle" dominant-baseline="middle">PREMIUM</text>
  <text x="${cardX + 44}" y="${cardY + 57}"
        font-family="Arial" font-size="9" font-weight="bold"
        fill="white" text-anchor="middle" dominant-baseline="middle">MEMBER</text>

  <!-- Member name -->
  <text x="${cardX + 92}" y="${cardY + 34}"
        font-family="Arial" font-size="20" font-weight="bold"
        fill="white">${escapeXml(name.toUpperCase())}</text>

  <!-- Tier label -->
  <text x="${cardX + 92}" y="${cardY + 57}"
        font-family="Arial" font-size="13" font-weight="bold"
        fill="${tierCfg.color}">${tierCfg.label}</text>

  <!-- Member ID -->
  <text x="${cardX + 92}" y="${cardY + 76}"
        font-family="Arial" font-size="12"
        fill="#CCCCCC">MEMBER ID: ${escapeXml(memberId)}</text>
</svg>`.trim();
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── Main export ────────────────────────────────────────────────────────────

/**
 * Generate a branded member card image.
 *
 * @param {object} opts
 * @param {string} opts.masterplatePath - Path to base image (relative to project root)
 * @param {string} opts.name            - Member full name
 * @param {string} opts.tier            - "gold" | "silver" | "bronze"
 * @param {string} opts.memberId        - e.g. "MFC-2026-001"
 * @returns {Promise<Buffer>}           - JPEG image buffer, ready to send
 */
async function generateMemberCard({ masterplatePath, name, tier, memberId }) {
  const absPath = path.resolve(masterplatePath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`Masterplate not found: ${absPath}`);
  }

  // Get masterplate dimensions so SVG matches exactly
  const meta = await sharp(absPath).metadata();
  const { width, height } = meta;

  const svg = buildOverlaySVG({ name, tier, memberId, width, height });
  const svgBuffer = Buffer.from(svg);

  const outputBuffer = await sharp(absPath)
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return outputBuffer;
}

/**
 * Generate and SAVE to disk (useful for testing).
 */
async function generateAndSave({ masterplatePath, name, tier, memberId, outputPath }) {
  const buf = await generateMemberCard({ masterplatePath, name, tier, memberId });
  fs.writeFileSync(outputPath, buf);
  console.log(`Saved: ${outputPath} (${(buf.length / 1024).toFixed(1)} KB)`);
  return outputPath;
}

module.exports = { generateMemberCard, generateAndSave };