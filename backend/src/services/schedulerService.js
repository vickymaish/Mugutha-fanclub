const cron = require('node-cron');

// All club schedules run on Nairobi time, whatever timezone the server is in.
// Set SCHEDULER_ENABLED=false to switch every scheduled job off (for example on
// a second copy of the server, so alerts are never sent twice).
function scheduleCron(expression, fn, { name = 'job' } = {}) {
  if (process.env.SCHEDULER_ENABLED === 'false') {
    console.log(`Scheduler off: ${name} not started`);
    return null;
  }
  return cron.schedule(expression, async () => {
    try { await fn(); } catch (err) { console.error(`${name} failed:`, err.message); }
  }, { timezone: 'Africa/Nairobi' });
}

module.exports = { scheduleCron };
