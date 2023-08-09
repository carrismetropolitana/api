/* * */
/* IMPORTS */
const crontab = require('node-cron');
const SERVERDB = require('./services/SERVERDB');
const syncHelpdesksStatus = require('./tasks/syncHelpdesksStatus');

//

(async function init() {
  //

  //
  await SERVERDB.connect();

  // Setup task
  let TASK_SYNC_HELPDESKS_STATUS = false;
  // Schedule task (helper: https://crontab.guru/#*_*_*_*_*)
  crontab.schedule('* * * * *', async () => {
    // CHECK IF TASK IS NOT ALREADY RUNNING
    if (!TASK_SYNC_HELPDESKS_STATUS) {
      TASK_SYNC_HELPDESKS_STATUS = true;
      await syncHelpdesksStatus();
      TASK_SYNC_HELPDESKS_STATUS = false;
    }
  });

  //
})();
