const { scheduleCron } = require('../services/schedulerService');
const { sendRenewalReminders } = require('../services/renewalService');

// Renewal reminders at 10:00 am Nairobi time: 7 days and 1 day before a membership ends.
function start() {
  scheduleCron('0 10 * * *', sendRenewalReminders, { name: 'renewalReminderJob' });
}

module.exports = { start };
