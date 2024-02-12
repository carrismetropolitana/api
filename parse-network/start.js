/* * */

const files = require('./config/files');

const NETWORKDB = require('./services/NETWORKDB');
const SERVERDB = require('./services/SERVERDB');

const timeCalc = require('./modules/timeCalc');
const setupBaseDirectory = require('./modules/setupBaseDirectory');
const fetchAndExtractLatestGtfs = require('./modules/fetchAndExtractLatestGtfs');
const setupPrepareAndImportFile = require('./modules/setupPrepareAndImportFile');

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
    await NETWORKDB.connect();
    await SERVERDB.connect();

    //

    console.log();
    console.log('STEP 0.1: Setup working directory');
    await setupBaseDirectory();

    //

    console.log();
    console.log('STEP 1.0: Fetch and Extract latest GTFS');
    await fetchAndExtractLatestGtfs();

    console.log();
    console.log('STEP 1.1: Import each GTFS file');
    for (const fileOptions of files) {
      await setupPrepareAndImportFile(fileOptions);
    }

    console.log();
    console.log('STEP 1.2: Parse Municipalities');
    await require('./parsers/municipalities.parser')();

    console.log();
    console.log('STEP 1.3: Parse Localities');
    await require('./parsers/localities.parser')();

    console.log();
    console.log('STEP 1.3: Parse Periods');
    await require('./parsers/periods.parser')();

    console.log();
    console.log('STEP 1.3: Parse Dates');
    await require('./parsers/dates.parsers')();

    console.log();
    console.log('STEP 1.4: Parse Stops');
    await require('./parsers/stops.parser')();

    console.log();
    console.log('STEP 1.5: Parse Shapes');
    await require('./parsers/shapes.parser')();

    console.log();
    console.log('STEP 1.6: Parse Lines, Routes and Patterns');
    await require('./parsers/linesRoutesPatterns.parser')();

    console.log();
    console.log('STEP 1.3: Parse Timetables');
    await require('./parsers/timetables.parser')();

    console.log();
    console.log('Disconnecting from databases...');
    await NETWORKDB.disconnect();
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
