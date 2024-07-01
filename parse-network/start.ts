/* * */

import files from '@/config/files';
import { ENABLED_MODULES } from '@/config/settings';
import extractGtfs from '@/modules/extractGtfs';
import fetchLatestGtfs from '@/modules/fetchLatestGtfs';
import getGtfsHash from '@/modules/getGtfsHash';
import setupBaseDirectory from '@/modules/setupBaseDirectory';
import setupPrepareAndImportFile from '@/modules/setupPrepareAndImportFile';
import { getElapsedTime } from '@/modules/timeCalc';
import archivesParser from '@/parsers/archives.parser';
import datesParser from '@/parsers/dates.parsers';
import linesRoutesPatternsParser from '@/parsers/linesRoutesPatterns.parser';
import localitiesParser from '@/parsers/localities.parser';
import municipalitiesParser from '@/parsers/municipalities.parser';
import newLinesRoutesPatternsParser from '@/parsers/newLinesRoutesPatterns.parser';
import periodsParser from '@/parsers/periods.parser';
import shapesParser from '@/parsers/shapes.parser';
import stopsParser from '@/parsers/stops.parser';
import NETWORKDB from '@/services/NETWORKDB';
import SERVERDB from '@/services/SERVERDB.js';
// import timetablesParser from '@/parsers/timetables.parser';

/* * */

let LAST_GTFS_HASH = null;

/* * */

export default async (): Promise<boolean> => {
	//

	try {
		console.log();
		console.log('------------------------');
		console.log((new Date()).toISOString());
		console.log('------------------------');
		console.log();

		//

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
		}
		else {
			//

			LAST_GTFS_HASH = currentGtfsHash;
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
				console.log('STEP 1.1: Parse Municipalities');
				await municipalitiesParser();
			}

			if (ENABLED_MODULES.includes('localities_parser')) {
				console.log();
				console.log('STEP 1.2: Parse Localities');
				await localitiesParser();
			}

			if (ENABLED_MODULES.includes('periods_parser')) {
				console.log();
				console.log('STEP 1.3: Parse Periods');
				await periodsParser();
			}

			if (ENABLED_MODULES.includes('dates_parser')) {
				console.log();
				console.log('STEP 1.4: Parse Dates');
				await datesParser();
			}

			if (ENABLED_MODULES.includes('archives_parser')) {
				console.log();
				console.log('STEP 1.4: Parse Archives');
				await archivesParser();
			}

			if (ENABLED_MODULES.includes('stops_parser')) {
				console.log();
				console.log('STEP 1.5: Parse Stops');
				await stopsParser();
			}

			if (ENABLED_MODULES.includes('shapes_parser')) {
				console.log();
				console.log('STEP 1.6: Parse Shapes');
				await shapesParser();
			}

			if (ENABLED_MODULES.includes('lines_routes_patterns_parser')) {
				console.log();
				console.log('STEP 1.7: Parse Lines, Routes and Patterns');
				await linesRoutesPatternsParser();
			}

			if (ENABLED_MODULES.includes('lines_routes_patterns_parser')) {
				console.log();
				console.log('STEP 1.7.1: NEW Parse Lines, Routes and Patterns');
				await newLinesRoutesPatternsParser();
			}

			// if (ENABLED_MODULES.includes('timetables_parser')) {
			// 	console.log();
			// 	console.log('STEP 1.8: Parse Timetables');
			// 	await timetablesParser();
			// }

			//
		}

		await SERVERDB.disconnect();
		await NETWORKDB.disconnect();

		console.log();
		console.log('------------------------');
		console.log(`Run took ${getElapsedTime(startTime)}.`);
		console.log('------------------------');
		console.log();
		return true;

		//
	}
	catch (err) {
		console.log('An error occurred. Halting execution.', err);
		return false;
	}

	//
};
