const { scheduleCron } = require('../services/schedulerService');

function start() {
  scheduleCron('0 9 * * *', () => {
    console.log('renewalReminderJob running');
  });
}

module.exports = { start };
