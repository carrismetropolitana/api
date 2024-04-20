/* * */

import files from '@/config/files';
import { ENABLED_MODULES } from '@/config/settings';

import SERVERDB from '@/services/SERVERDB';
import NETWORKDB from '@/services/NETWORKDB';

import { getElapsedTime } from '@/modules/timeCalc';
import setupBaseDirectory from '@/modules/setupBaseDirectory';
import extractGtfs from '@/modules/extractGtfs';
import fetchLatestGtfs from '@/modules/fetchLatestGtfs';
import setupPrepareAndImportFile from '@/modules/setupPrepareAndImportFile';
import getGtfsHash from '@/modules/getGtfsHash';

import municipalitiesParser from '@/parsers/municipalities.parser';
import localitiesParser from '@/parsers/localities.parser';
import periodsParser from '@/parsers/periods.parser';
import datesParser from '@/parsers/dates.parsers';
import stopsParser from '@/parsers/stops.parser';
import shapesParser from '@/parsers/shapes.parser';
import linesRoutesPatternsParser from '@/parsers/linesRoutesPatterns.parser';
import timetablesParser from '@/parsers/timetables.parser';

/* * */

let LAST_GTFS_HASH = null;
let SHOULD_RUN_PARSERS = false;

/* * */

export default async () => {
	//

	try {
		console.log();
		console.log('------------------------');
		console.log((new Date).toISOString());
		console.log('------------------------');
		console.log();

		// Store start time for logging purposes
		const startTime = process.hrtime();
		console.log('Starting...');

		//

		await SERVERDB.connect();
		await NETWORKDB.connect();

		//

		console.log();
		console.log('STEP 0.1: Fetch latest GTFS');
		await setupBaseDirectory();
		await fetchLatestGtfs();

		console.log();
		console.log('STEP 0.2: Compare with previous GTFS');
		const currentGtfsHash = await getGtfsHash();

		if (LAST_GTFS_HASH === currentGtfsHash) {
			console.log('⤷ No changes in GTFS file, skipping this run.');
		} else {
			//

			LAST_GTFS_HASH = currentGtfsHash;
			SHOULD_RUN_PARSERS = true;
			console.log('⤷ GTFS changed since previous run. Continuing...');

			//

			if (ENABLED_MODULES.includes('gtfs_import')) {
				console.log();
				console.log('STEP 1.0: Extract GTFS');
				await extractGtfs();
				for (const fileOptions of files) {
					await setupPrepareAndImportFile(fileOptions);
				}
			}

			if (ENABLED_MODULES.includes('municipalities_parser')) {
				console.log();
				console.log('STEP 1.2: Parse Municipalities');
				await municipalitiesParser();
			}

			if (ENABLED_MODULES.includes('localities_parser')) {
				console.log();
				console.log('STEP 1.3: Parse Localities');
				await localitiesParser();
			}

			if (ENABLED_MODULES.includes('periods_parser')) {
				console.log();
				console.log('STEP 1.3: Parse Periods');
				await periodsParser();
			}

			if (ENABLED_MODULES.includes('dates_parser')) {
				console.log();
				console.log('STEP 1.3: Parse Dates');
				await datesParser();
			}

			if (ENABLED_MODULES.includes('stops_parser')) {
				console.log();
				console.log('STEP 1.4: Parse Stops');
				await stopsParser();
			}

			if (ENABLED_MODULES.includes('shapes_parser')) {
				console.log();
				console.log('STEP 1.5: Parse Shapes');
				await shapesParser();
			}

			if (ENABLED_MODULES.includes('lines_routes_patterns_parser')) {
				console.log();
				console.log('STEP 1.6: Parse Lines, Routes and Patterns');
				await linesRoutesPatternsParser();
			}

			if (ENABLED_MODULES.includes('timetables_parser')) {
				console.log();
				console.log('STEP 1.7: Parse Timetables');
				await timetablesParser();
			}

			//
		}

		await SERVERDB.disconnect();
		await NETWORKDB.disconnect();

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