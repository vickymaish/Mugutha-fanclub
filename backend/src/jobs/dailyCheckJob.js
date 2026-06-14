const { scheduleCron } = require('../services/schedulerService');

function start() {
  scheduleCron('0 0 * * *', () => {
    console.log('dailyCheckJob running');
  });
}

module.exports = { start };
