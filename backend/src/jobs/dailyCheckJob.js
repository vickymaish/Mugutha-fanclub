const { scheduleCron } = require('../services/schedulerService');
const { markExpiredMembers } = require('../services/renewalService');

// Just after midnight Nairobi time: memberships whose end date has passed become 'expired'.
function start() {
  scheduleCron('5 0 * * *', markExpiredMembers, { name: 'dailyCheckJob' });
}

module.exports = { start };
