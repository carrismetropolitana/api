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
const buildSchools = require('./builders/buildSchools');
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

    //
    //
    // GLOBAL STARTUP

    console.log();
    console.log('STEP 0.0: Connect to databases');
    await FEEDERDB.connect();
    await SERVERDB.connect();

    console.log();
    console.log('STEP 0.1: Setup working directory');
    await setupBaseDirectory();

    //
    //
    // DATASETS

    console.log();
    console.log('STEP 1.0: Fetch and Import Datasets');
    for (const fileOptions of files) {
      if (fileOptions.type !== 'datasets') continue;
      await fetchAndExtractLatestDataset(fileOptions);
      await setupPrepareAndImportFile(fileOptions);
    }

    console.log();
    console.log('STEP 1.1: Update Facilities');
    await buildSchools();

    //
    //
    // GTFS

    console.log();
    console.log('STEP 2.0: Fetch and Extract latest GTFS');
    await fetchAndExtractLatestGtfs();

    console.log();
    console.log('STEP 2.1: Import each GTFS file');
    for (const fileOptions of files) {
      if (fileOptions.type !== 'gtfs') continue;
      await setupPrepareAndImportFile(fileOptions);
    }

    // console.log();
    // console.log('STEP 2.2: Update Municipalities');
    // await buildMunicipalities();

    // console.log();
    // console.log('STEP 2.3: Update Helpdesks');
    // await buildHelpdesks();

    // console.log();
    // console.log('STEP 2.4: Update Stops');
    // await buildStops();

    // console.log();
    // console.log('STEP 2.5: Update Shapes');
    // await buildShapes();

    console.log();
    console.log('STEP 2.6: Update Lines & Patterns');
    await buildLinesAndPatterns();

    console.log();
    console.log('Disconnecting from databases...');
    await FEEDERDB.disconnect();
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

  IS_TASK_RUNNING = false;
}
