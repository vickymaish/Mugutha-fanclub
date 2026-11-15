const { scheduleCron } = require('../services/schedulerService');
const { sendScheduledAlerts } = require('../services/matchAlertService');

// Match-day alerts (Nairobi time):
//   6:00 pm  - the evening before each match
//   8:00 am  - the morning of the match
function start() {
  scheduleCron('0 18 * * *', () => sendScheduledAlerts('day_before'), { name: 'matchReminderJob (day before)' });
  scheduleCron('0 8 * * *', () => sendScheduledAlerts('matchday'), { name: 'matchReminderJob (match day)' });
}

module.exports = { start };
