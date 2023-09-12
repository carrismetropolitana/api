const settings = require('./config/settings');
const start = require('./start');

//

(async function init() {
  //

  let TASK_IS_RUNNING = false;

  await start();

  setInterval(async () => {
    //
    // Check if task is already running
    if (TASK_IS_RUNNING) throw new Error('Force restart program.');

    TASK_IS_RUNNING = true;

    await start();

    TASK_IS_RUNNING = false;

    //
  }, settings.RUN_INTERVAL);

  //
})();
