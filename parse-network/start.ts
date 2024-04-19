/* * */

import files from './config/files';

import { getElapsedTime } from './modules/timeCalc';
import setupBaseDirectory from './modules/setupBaseDirectory';
import extractGtfs from './modules/extractGtfs';
import fetchLatestGtfs from './modules/fetchLatestGtfs';
import setupPrepareAndImportFile from './modules/setupPrepareAndImportFile';

import municipalitiesParser from './parsers/municipalities.parser';
import localitiesParser from './parsers/localities.parser';
import periodsParser from './parsers/periods.parser';
import datesParser from './parsers/dates.parsers';
import stopsParser from './parsers/stops.parser';
import shapesParser from './parsers/shapes.parser';
import linesRoutesPatternsParser from './parsers/linesRoutesPatterns.parser';
import timetablesParser from './parsers/timetables.parser';
import getGtfsHash from './modules/getGtfsHash';

/* * */

const SKIP_INIT = false;

let lastGtfsHash = null;

export default async () => {
	//

	try {
		console.log();
		console.log('-----------------------------------------');
		console.log((new Date).toISOString());
		console.log('-----------------------------------------');
		console.log();

		// Store start time for logging purposes
		const startTime = process.hrtime();
		console.log('Starting...');

		//

		//

		if (SKIP_INIT) {
			console.log();
			console.log('Skipping initial setup...');
			console.log();
		} else {
			console.log();
			console.log('STEP 0.1: Setup working directory');
			await setupBaseDirectory();

			//
			console.log();
			console.log('STEP 0.2: Fetch latest GTFS');
			await fetchLatestGtfs();

			console.log();
			console.log('STEP 0.3: Compare with previous GTFS');
			const currentGtfsHash = await getGtfsHash();
			if (lastGtfsHash === currentGtfsHash) {
				console.log('No changes in GTFS file, skipping this run.');
				return;
			}
			lastGtfsHash = currentGtfsHash;

			console.log();
			console.log('STEP 1.0: Extract GTFS');
			await extractGtfs();

			console.log();
			console.log('STEP 1.1: Import each GTFS file');
			for (const fileOptions of files) {
				await setupPrepareAndImportFile(fileOptions);
			}

			console.log();
			console.log('STEP 1.2: Parse Municipalities');
			await municipalitiesParser();

			console.log();
			console.log('STEP 1.3: Parse Localities');
			await localitiesParser();

			console.log();
			console.log('STEP 1.3: Parse Periods');
			await periodsParser();

			console.log();
			console.log('STEP 1.3: Parse Dates');
			await datesParser();

			console.log();
			console.log('STEP 1.4: Parse Stops');
			await stopsParser();

			console.log();
			console.log('STEP 1.5: Parse Shapes');
			await shapesParser();

			console.log();
			console.log('STEP 1.6: Parse Lines, Routes and Patterns');
			await linesRoutesPatternsParser();
		}
		console.log();
		console.log('STEP 1.7: Parse Timetables');
		await timetablesParser();

		// console.log();
		// console.log('Disconnecting from databases...');
		// await disconnect();
		// await _disconnect();

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