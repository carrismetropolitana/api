const settings = require('./config/settings');
const files = require('./config/files');

const crontab = require('node-cron');
const FEEDERDB = require('./services/FEEDERDB');
const SERVERDB = require('./services/SERVERDB');

const timeCalc = require('./modules/timeCalc');
const setupBaseDirectory = require('./modules/setupBaseDirectory');
const fetchAndExtractLatestGtfs = require('./modules/fetchAndExtractLatestGtfs');
const setupPrepareAndImportFile = require('./modules/setupPrepareAndImportFile');

const buildMunicipalities = require('./builders/buildMunicipalities');
const buildFacilities = require('./builders/buildFacilities');
const buildHelpdesks = require('./builders/buildHelpdesks');
const buildStops = require('./builders/buildStops');
const buildShapes = require('./builders/buildShapes');
const buildLinesAndPatterns = require('./builders/buildLinesAndPatterns');

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
    await setupBaseDirectory(settings.BASE_DIR);

    console.log();
    console.log('STEP 3: Fetch and Extract latest GTFS');
    await fetchAndExtractLatestGtfs(settings.BASE_DIR, settings.GTFS_BASE_DIR, settings.GTFS_EXTRACTED_DIR, settings.GTFS_URL);

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
    await buildMunicipalities();

    console.log();
    console.log('STEP 8: Update Facilities');
    await buildFacilities();

    console.log();
    console.log('STEP 9: Update Helpdesks');
    await buildHelpdesks();

    console.log();
    console.log('STEP 10: Update Stops');
    await buildStops();

    console.log();
    console.log('STEP 11: Update Shapes');
    await buildShapes();

    console.log();
    console.log('STEP 12: Update Lines & Patterns');
    await buildLinesAndPatterns();

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
    setTimeout(() => {
      process.exit(0); // End process
    }, 10000); // after 10 seconds
  }

  IS_TASK_RUNNING = false;
}
