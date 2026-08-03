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
function buildOverlaySVG({ name, tier, width, height }) {
  const tierCfg = TIER_CONFIG[tier?.toLowerCase()] || TIER_CONFIG.gold;

  // ── Positioning ──
  // nameY 0.48 centers the text perfectly within the middle dark band
  const nameX = 0.50;           
  const nameY = 0.48;           
  const nameSize = 0.040;       

  // Convert relative → absolute pixels
  const nx = Math.round(nameX * width);
  const ny = Math.round(nameY * height);
  const nf = Math.round(nameSize * height);

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- MEMBER NAME — Minimalist centered design -->
  <text x="${nx}" y="${ny}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${nf}"
        font-weight="bold"
        fill="${tierCfg.color}"
        text-anchor="middle"
        filter="url(#glow)">
    ${esc(name.toUpperCase())}
  </text>
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

async function generateMemberCard({ masterplatePath, name, tier }) {
  const absPath = path.resolve(masterplatePath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`Masterplate not found: ${absPath}`);
  }

  const meta = await sharp(absPath).metadata();
  const { width, height } = meta;

  const svg = buildOverlaySVG({ name, tier, width, height });
  const svgBuffer = Buffer.from(svg);

  const outputBuffer = await sharp(absPath)
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();

  return outputBuffer;
}

module.exports = { generateMemberCard };