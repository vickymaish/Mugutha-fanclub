const cron = require('node-cron');

function scheduleCron(expression, fn) {
  return cron.schedule(expression, fn);
}

module.exports = { scheduleCron };
