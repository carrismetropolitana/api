/* * */

import files from './config/files';

import { connect, disconnect } from './services/NETWORKDB';
import { connect as _connect, disconnect as _disconnect } from './services/SERVERDB';

import { getElapsedTime } from './modules/timeCalc';
import setupBaseDirectory from './modules/setupBaseDirectory';
import fetchAndExtractLatestGtfs from './modules/fetchAndExtractLatestGtfs';
import setupPrepareAndImportFile from './modules/setupPrepareAndImportFile';


import municipalitiesParser from './parsers/municipalities.parser';
import localitiesParser from './parsers/localities.parser';
import periodsParser from './parsers/periods.parser';
import datesParser from './parsers/dates.parsers';
import stopsParser from './parsers/stops.parser';
import shapesParser from './parsers/shapes.parser';
import linesRoutesPatternsParser from './parsers/linesRoutesPatterns.parser';
import timetablesParser from './parsers/timetables.parser';


/* * */

export default async () => {
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
    await connect();
    await _connect();

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
    municipalitiesParser();

    console.log();
    console.log('STEP 1.3: Parse Localities');
    localitiesParser();

    console.log();
    console.log('STEP 1.3: Parse Periods');
    periodsParser();

    console.log();
    console.log('STEP 1.3: Parse Dates');
    datesParser();

    console.log();
    console.log('STEP 1.4: Parse Stops');
    stopsParser();

    console.log();
    console.log('STEP 1.5: Parse Shapes');
    shapesParser();

    console.log();
    console.log('STEP 1.6: Parse Lines, Routes and Patterns');
    linesRoutesPatternsParser()

    console.log();
    console.log('STEP 1.3: Parse Timetables');
    timetablesParser();

    console.log();
    console.log('Disconnecting from databases...');
    await disconnect();
    await _disconnect();

    console.log();
    console.log('- - - - - - - - - - - - - - - - - - - - -');
    console.log(`Run took ${getElapsedTime(startTime)}.`);
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
