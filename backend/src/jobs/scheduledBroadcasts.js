const { scheduleCron } = require('../services/schedulerService');
const { listScheduledBroadcasts } = require('../models/supabaseQueries');
const { sendBroadcastNow } = require('../services/broadcastService');

async function processScheduled() {
  try {
    const broadcasts = await listScheduledBroadcasts();
    for (const broadcast of broadcasts) {
      try {
        await sendBroadcastNow(broadcast);
      } catch (error) {
        console.error('scheduledBroadcasts failed for broadcast', broadcast.id, error.message || error);
      }
    }
  } catch (error) {
    console.error('scheduledBroadcasts error', error.message || error);
  }
}

function start() {
  scheduleCron('*/5 * * * *', processScheduled);
}

module.exports = { start };
