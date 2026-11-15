'use strict';

// Every 2 minutes: ask Safaricom about M-Pesa prompts whose callback never came.
const { scheduleCron } = require('../services/schedulerService');
const { reconcilePendingPayments } = require('../services/paymentService');

let running = false;

async function run() {
  if (running) return;
  running = true;
  try {
    const results = await reconcilePendingPayments();
    if (results.some((r) => r !== 'pending')) console.log('Payment check:', results.join(', '));
  } catch (error) {
    console.error('Payment check failed:', error.message);
  } finally {
    running = false;
  }
}

function start() {
  scheduleCron('*/2 * * * *', run);
}

module.exports = { start, run };
