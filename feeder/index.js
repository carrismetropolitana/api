const settings = require('./config/settings');
const files = require('./config/files');

const crontab = require('node-cron');
const FEEDERDB = require('./services/FEEDERDB');
const SERVERDB = require('./services/SERVERDB');

const timeCalc = require('./modules/timeCalc');
const setupBaseDirectory = require('./modules/setupBaseDirectory');
const fetchAndExtractLatestGtfs = require('./modules/fetchAndExtractLatestGtfs');
const fetchAndExtractLatestDataset = require('./modules/fetchAndExtractLatestDataset');
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
crontab.schedule(settings.CRON_INTERVAL, async () => {
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
    await setupBaseDirectory();

    console.log();
    console.log('STEP 3: Fetch and Extract latest GTFS');
    await fetchAndExtractLatestGtfs();

    console.log();
    console.log('STEP 4: Fetch and Extract latest Datasets');
    for (const fileOptions of files) {
      if (fileOptions.type !== 'datasets') continue;
      await fetchAndExtractLatestDataset(fileOptions);
    }

    console.log();
    console.log('STEP 5: Setup Tables, Prepare and Import each file');
    for (const fileOptions of files) {
      await setupPrepareAndImportFile(fileOptions);
    }

    console.log();
    console.log('STEP 6: Update Municipalities');
    await buildMunicipalities();

    console.log();
    console.log('STEP 7: Update Facilities');
    await buildFacilities();

    console.log();
    console.log('STEP 8: Update Helpdesks');
    await buildHelpdesks();

    console.log();
    console.log('STEP 9: Update Stops');
    await buildStops();

    console.log();
    console.log('STEP 10: Update Shapes');
    await buildShapes();

    console.log();
    console.log('STEP 11: Update Lines & Patterns');
    await buildLinesAndPatterns();

    console.log();
    console.log('STEP 12: Disconnect from databases...');
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
