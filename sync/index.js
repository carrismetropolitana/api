/* * */
/* IMPORTS */
const SERVERDB = require('./services/SERVERDB');
const syncHelpdesksStatus = require('./tasks/syncHelpdesksStatus');

//

(async function init() {
  //

  //
  await SERVERDB.connect();

  // Setup tasks
  await syncHelpdesksStatus();

  //
})();
