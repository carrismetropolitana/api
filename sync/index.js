//
const SERVERDBREDIS = require('./services/SERVERDBREDIS');
const syncEncmStatus = require('./tasks/syncEncmStatus');

//

(async function init() {
  //

  //
  await SERVERDBREDIS.connect();

  // Setup tasks
  await syncEncmStatus();

  //
})();
