/* * */
/* IMPORTS */
const SERVERDB = require('./services/SERVERDB');
const SERVERDBREDIS = require('./services/SERVERDBREDIS');
const syncHelpdesksStatus = require('./tasks/syncHelpdesksStatus');

//

(async function init() {
  //

  //
  await SERVERDB.connect();
  await SERVERDBREDIS.connect();

  // Setup tasks
  await syncHelpdesksStatus();

  //
})();
