/* * */

const SERVERDB = require('./services/SERVERDB');

const timeCalc = require('./modules/timeCalc');
const setupBaseDirectory = require('./modules/setupBaseDirectory');
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

    //

    console.log();
    console.log('STEP 0.2: Setup working directory');
    await setupBaseDirectory();

    //

    console.log();
    console.log('STEP 0.3: Clone GIT repository');
    await cloneGitRepository();

    //

    console.log();
    console.log('STEP 1.1: Update Facilities > ENCM');
    await require('./parsers/facilities.encm.parser')();

    //

    console.log();
    console.log('STEP 1.2: Update Facilities > Schools');
    // await require('./parsers/facilities.schools.parser')();

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
