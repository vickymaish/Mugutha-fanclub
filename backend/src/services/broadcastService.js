// backend/src/services/broadcastService.js

const { listAllMembers, listMembersByTier, updateBroadcastStatus } = require('../models/supabaseQueries');
const { sendMessage } = require('./whatsappService');

async function sendBroadcastToMembers(broadcast, members) {
  const results = {
    total: members.length,
    sent: 0,
    failed: 0,
    failures: []
  };

  for (const member of members) {
    try {
      await sendMessage({
        broadcastId: broadcast.id,
        memberId: member.id,
        phone: member.phone,
        message: broadcast.message,
        title: broadcast.title
      });
      results.sent++;
    } catch (error) {
      results.failed++;
      results.failures.push({
        memberId: member.id,
        phone: member.phone,
        error: error.message || 'unknown error'
      });
    }
  }

  return results;
}

async function sendBroadcastNow(broadcast) {
  // ✅ Use tier to filter members
  const tier = broadcast.tier || 'all';
  let members;
  
  if (tier === 'all') {
    members = await listAllMembers('active');
  } else {
    members = await listMembersByTier(tier, 'active');
  }
  
  // Members who replied STOP don't get broadcasts.
  // Demo members (is_demo) have fake numbers, so they never get real broadcasts.
  members = (members || []).filter((m) => !m.opted_out && !m.is_demo);

  if (!members || members.length === 0) {
    throw new Error(`No active members found for tier: ${tier}`);
  }
  
  const results = await sendBroadcastToMembers(broadcast, members);
  await updateBroadcastStatus(broadcast.id, 'sent');
  
  return { 
    broadcast, 
    membersSent: members.length,
    tier: tier,
    results 
  };
}

module.exports = {
  sendBroadcastToMembers,
  sendBroadcastNow
};