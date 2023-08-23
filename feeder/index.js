/* * */
/* IMPORTS */
const crontab = require('node-cron');
const FEEDERDB = require('./databases/FEEDERDB');
const SERVERDB = require('./databases/SERVERDB');

const files = require('./files/files');

const setupBaseDirectory = require('./tasks/setupBaseDirectory');
const fetchAndExtractLatestGtfs = require('./tasks/fetchAndExtractLatestGtfs');
const setupPrepareAndImportFile = require('./tasks/setupPrepareAndImportFile');

const timeCalc = require('./modules/timeCalc');
const updateMunicipalities = require('./modules/updateMunicipalities');
const updateFacilities = require('./modules/updateFacilities');
const updateHelpdesks = require('./modules/updateHelpdesks');
const updateStops = require('./modules/updateStops');
const updateShapes = require('./modules/updateShapes');
const updateLinesAndPatterns = require('./modules/updateLinesAndPatterns');

//
//
//
//
//
//

const BASE_DIR = '/tmp/base';
const GTFS_BASE_DIR = 'gtfs';
const GTFS_EXTRACTED_DIR = 'extracted';
const GTFS_PARSED_DIR = 'parsed';
const GTFS_URL = 'https://github.com/carrismetropolitana/gtfs/raw/live/CarrisMetropolitana.zip';

const DATASETS_BASE_DIR = 'datasets';
const DATASETS_PARSED_DIR = 'parsed';
const DATASETS_BASE_URL = 'https://github.com/carrismetropolitana/gtfs/raw/latest/';

//
//
//
//
//

let IS_TASK_RUNNING = false;

// Schedule task (helper: https://crontab.guru/#0_*/3_*_*_*)
crontab.schedule('0 */3 * * *', async () => {
  // CHECK IF TASK IS NOT ALREADY RUNNING
  if (!IS_TASK_RUNNING) await appInitPoint();
});

appInitPoint();
async function appInitPoint() {
  IS_TASK_RUNNING = true;

  try {
    console.log();
    console.log('-----------------------------------------');
    console.log(new Date().toISOString());
    console.log('-----------------------------------------');
    console.log();

    // Store start time for logging purposes
    const startTime = process.hrtime();
    console.log('Starting...');

    console.log();
    console.log('STEP 1: Connect to databases');
    await FEEDERDB.connect();
    await SERVERDB.connect();

    console.log();
    console.log('STEP 2: Setup working directory');
    await setupBaseDirectory(BASE_DIR);

    console.log();
    console.log('STEP 3: Fetch and Extract latest GTFS');
    await fetchAndExtractLatestGtfs(BASE_DIR, GTFS_BASE_DIR, GTFS_EXTRACTED_DIR, GTFS_URL);

    console.log();
    console.log('STEP 4: Setup Tables, Prepare and Import each file');
    for (const fileOptions of files) {
      await setupPrepareAndImportFile(fileOptions);
    }

    //
    //
    //

    console.log();
    console.log('STEP 7: Update Municipalities');
    await updateMunicipalities();

    console.log();
    console.log('STEP 8: Update Facilities');
    await updateFacilities();

    console.log();
    console.log('STEP 9: Update Helpdesks');
    await updateHelpdesks();

    console.log();
    console.log('STEP 10: Update Stops');
    await updateStops();

    console.log();
    console.log('STEP 11: Update Shapes');
    await updateShapes();

    console.log();
    console.log('STEP 12: Update Lines & Patterns');
    await updateLinesAndPatterns();

    console.log();
    console.log('STEP 13: Disconnect from databases...');
    await FEEDERDB.disconnect();
    await SERVERDB.disconnect();

    console.log();
    console.log('- - - - - - - - - - - - - - - - - - - - -');
    console.log(`Operation took ${timeCalc.getElapsedTime(startTime)}.`);
    console.log('- - - - - - - - - - - - - - - - - - - - -');
    console.log();

    //
  } catch (err) {
    console.log('An error occurred. Halting execution.', err);
    console.log('Retrying in 10 seconds...');
    // TODO: Send email / notify on error
    setTimeout(() => {
      process.exit(0); // End process
    }, 10000); // after 10 seconds
  }

  IS_TASK_RUNNING = false;
}
