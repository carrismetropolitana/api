/* * */
/* IMPORTS */
const crontab = require('node-cron');
const SERVERDB = require('./services/SERVERDB');
const syncHelpdesksStatus = require('./tasks/syncHelpdesksStatus');
const syncStopsStatus = require('./tasks/syncStopsStatus');

//

(async function init() {
  //

  //
  await SERVERDB.connect();

  // Setup task 1
  let TASK_SYNC_HELPDESKS_STATUS = false;
  // Schedule task (helper: https://crontab.guru/#*_*_*_*_*)
  crontab.schedule('* * * * *', async () => {
    // CHECK IF TASK IS NOT ALREADY RUNNING
    if (!TASK_SYNC_HELPDESKS_STATUS) {
      console.log('-- will run task');
      TASK_SYNC_HELPDESKS_STATUS = true;
      await syncHelpdesksStatus();
      TASK_SYNC_HELPDESKS_STATUS = false;
      console.log('-- did run task - finish');
    }
  });

  // Setup task 2
  let TASK_SYNC_STOPS_STATUS = false;
  // Schedule task (helper: https://crontab.guru/#*_*_*_*_*)
  crontab.schedule('* * * * *', async () => {
    // CHECK IF TASK IS NOT ALREADY RUNNING
    if (!TASK_SYNC_STOPS_STATUS) {
      console.log('-- will run task');
      TASK_SYNC_STOPS_STATUS = true;
      await syncStopsStatus();
      TASK_SYNC_STOPS_STATUS = false;
      console.log('-- did run task - finish');
    }
  });

  //
})();
