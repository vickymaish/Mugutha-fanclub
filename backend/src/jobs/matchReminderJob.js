const { scheduleCron } = require('../services/schedulerService');

function start() {
  // runs daily at 8am
  scheduleCron('0 8 * * *', () => {
    console.log('matchReminderJob running');
  });
}

module.exports = { start };
