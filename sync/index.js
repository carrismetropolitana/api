/* * */
/* IMPORTS */
const SERVERDB = require('./services/SERVERDB');
const syncEncmStatus = require('./tasks/syncEncmStatus');

//

(async function init() {
  //

  //
  await SERVERDB.connect();

  // Setup tasks
  await syncEncmStatus();

  //
})();
