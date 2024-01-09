/* * */

const files = require('./config/files');

const SERVERDB = require('./services/SERVERDB');

const timeCalc = require('./modules/timeCalc');
const setupBaseDirectory = require('./modules/setupBaseDirectory');
// const fetchAndExtractLatestDataset = require('./modules/fetchAndExtractLatestDataset');
// const setupPrepareAndImportFile = require('./modules/setupPrepareAndImportFile');

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
    console.log('STEP 0.0: Connect to databases');
    await SERVERDB.connect();

    //

    console.log();
    console.log('STEP 0.1: Setup working directory');
    await setupBaseDirectory();

    //

    console.log();
    console.log('STEP 1.0: Clone GIT repository');
    await cloneGitRepository();

    // console.log();
    // console.log('STEP 1.0: Clone GIT repository');
    // for (const fileOptions of files) {
    //   if (fileOptions.type !== 'datasets') continue;
    //   await fetchAndExtractLatestDataset(fileOptions);
    //   await setupPrepareAndImportFile(fileOptions);
    // }

    // console.log();
    // console.log('STEP 1.1: Update Facilities');
    // await require('./builders/datasets/facilities.schools.builder')();
    // await require('./builders/datasets/facilities.encm.builder')();

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
