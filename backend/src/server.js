const app = require('./app');
const { port } = require('./config/env');
const matchJob = require('./jobs/matchReminderJob');
const renewalJob = require('./jobs/renewalReminderJob');
const dailyJob = require('./jobs/dailyCheckJob');
const scheduledBroadcasts = require('./jobs/scheduledBroadcasts');

async function start(){
  matchJob.start();
  renewalJob.start();
  dailyJob.start();
  scheduledBroadcasts.start();
  app.listen(port, ()=> console.log('Server listening on', port));
}

start().catch(err=>{
  console.error(err);
  process.exit(1);
});
