/* * */

const SERVERDB = require('./services/SERVERDB');
const timeCalc = require('./modules/timeCalc');
const cloneGitRepository = require('./modules/cloneGitRepository');

/* * */

module.exports = async () => {
  //

  try {
    console.log();
    console.log('-----------------------------------------');
    console.log(new Date().toISOString());
    console.log('-----------------------------------------');
    console.log();

    // Store start time for logging purposes
    const startTime = process.hrtime();
    console.log('Starting...');

    //

    console.log();
    console.log('STEP 0.1: Connect to databases');
    await SERVERDB.connect();

    console.log();
    console.log('STEP 0.2: Clone Git repository');
    await cloneGitRepository();

    //

    console.log();
    console.log('STEP 1.1. Parse datasets/facilities/encm');
    await require('./parsers/facilities.encm.parser')();

    console.log();
    console.log('STEP 1.2. Parse datasets/facilities/schools');
    await require('./parsers/facilities.schools.parser')();

    //

    console.log();
    console.log('STEP 2.1. Parse datasets/connections/boat_stations');
    await require('./parsers/connections.boat_stations.parser')();

    console.log();
    console.log('STEP 2.2. Parse datasets/connections/light_rail_stations');
    await require('./parsers/connections.light_rail_stations.parser')();

    console.log();
    console.log('STEP 2.3. Parse datasets/connections/subway_stations');
    await require('./parsers/connections.subway_stations.parser')();

    console.log();
    console.log('STEP 2.4. Parse datasets/connections/train_stations');
    await require('./parsers/connections.train_stations.parser')();

    //

    console.log();
    console.log('STEP 3.1: Parse datasets/demand/date-line-stop');
    await require('./parsers/demand.date-line-stop.parser')();

    //

    console.log();
    console.log('Disconnecting from databases...');
    await SERVERDB.disconnect();

    console.log();
    console.log('- - - - - - - - - - - - - - - - - - - - -');
    console.log(`Run took ${timeCalc.getElapsedTime(startTime)}.`);
    console.log('- - - - - - - - - - - - - - - - - - - - -');
    console.log();

    //
  } catch (err) {
    console.log('An error occurred. Halting execution.', err);
    console.log('Retrying in 10 seconds...');
    setTimeout(() => {
      process.exit(0); // End process
    }, 10000); // after 10 seconds
  }

  //
};
