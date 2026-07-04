// backend/test-image-send.js
//
// Run from backend/ folder:
//   node test-image-send.js
//
// This does the full pipeline in one go:
//   1. Generate branded member card (Buffer)
//   2. Upload to Meta → get media_id
//   3. Send image to your phone via WhatsApp
//
// If your phone receives the branded image, the core premium pipeline is complete.

require('dotenv').config();

const { generateMemberCard } = require('./src/services/imageService');
const { uploadImage, sendImage } = require('./src/services/mediaService');

const TEST_MEMBER = {
  phone: '254736506027',          // your verified test number
  name: 'Victor Omondi',
  tier: 'gold',
  memberId: 'MFC-2026-001',
  masterplatePath: './assets/masterplate-gold.jpg',
};

const CAPTION = `⚽ *Mugutha FC*\nWelcome, ${TEST_MEMBER.name}!\nYour Gold membership is active.\nMember ID: ${TEST_MEMBER.memberId}`;

async function run() {
  console.log('\n── Step 1: Generating member card ──────────────────');
  const imageBuffer = await generateMemberCard({
    masterplatePath: TEST_MEMBER.masterplatePath,
    name: TEST_MEMBER.name,
    tier: TEST_MEMBER.tier,
    memberId: TEST_MEMBER.memberId,
  });
  console.log(`Generated: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

  console.log('\n── Step 2: Uploading to Meta ────────────────────────');
  const mediaId = await uploadImage(imageBuffer);
  console.log(`media_id: ${mediaId}`);

  console.log('\n── Step 3: Sending to WhatsApp ──────────────────────');
  const messageId = await sendImage(TEST_MEMBER.phone, mediaId, CAPTION);
  console.log(`message_id: ${messageId}`);

  console.log('\n✅ Done. Check your WhatsApp for the branded image.');
}

run().catch(err => {
  console.error('\n❌ Failed:', err.response?.data || err.message);
  process.exit(1);
});