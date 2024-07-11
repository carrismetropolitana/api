/* * */

import files from '@/config/files.js';
import { ENABLED_MODULES } from '@/config/settings.js';
import extractGtfs from '@/modules/extractGtfs.js';
import fetchLatestGtfs from '@/modules/fetchLatestGtfs.js';
import getGtfsHash from '@/modules/getGtfsHash.js';
import setupBaseDirectory from '@/modules/setupBaseDirectory.js';
import setupPrepareAndImportFile from '@/modules/setupPrepareAndImportFile.js';
import { getElapsedTime } from '@/modules/timeCalc.js';
import archivesParser from '@/parsers/archives.parser.js';
import datesParser from '@/parsers/dates.parsers.js';
import linesRoutesPatternsParser from '@/parsers/linesRoutesPatterns.parser.js';
import localitiesParser from '@/parsers/localities.parser.js';
import municipalitiesParser from '@/parsers/municipalities.parser.js';
import newLinesRoutesPatternsParser from '@/parsers/newLinesRoutesPatterns.parser.js';
import periodsParser from '@/parsers/periods.parser.js';
import shapesParser from '@/parsers/shapes.parser.js';
import stopsParser from '@/parsers/stops.parser.js';
import timetablesParser from '@/parsers/timetables.parser.js';
import NETWORKDB from '@/services/NETWORKDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

let LAST_GTFS_HASH = null;

/* * */

export default async (): Promise<boolean> => {
	try {
		//

		LOGGER.init();

		const globalTimer = new TIMETRACKER();

		//

		await SERVERDB.connect();
		await NETWORKDB.connect();

		//

		try {
			LOGGER.spacer(1);
			LOGGER.title(`1.1. Fetching latest GTFS...`);
			const fetchGtfsTimer = new TIMETRACKER();

			await setupBaseDirectory();
			await fetchLatestGtfs();

			LOGGER.success(`Fetched latest GTFS (${fetchGtfsTimer.get()})`);
		}
		catch (error) {
			LOGGER.error('Error while fetching latest GTFS (Step 1.1.)', error);
		}

		//

		try {
			LOGGER.spacer(1);
			LOGGER.title(`1.2. Compare latest with previous GTFS...`);
			const compareGtfsTimer = new TIMETRACKER();

			const currentGtfsHash = await getGtfsHash();

			if (LAST_GTFS_HASH === currentGtfsHash) {
				//
				await SERVERDB.disconnect();
				await NETWORKDB.disconnect();

				LOGGER.success(`Skipping this run as latest GTFS is the same as previous run (${compareGtfsTimer.get()})`);
				LOGGER.terminate(`Run took ${globalTimer.get()}.`);

				return;
			}

			LAST_GTFS_HASH = currentGtfsHash;

			LOGGER.info(`Latest GTFS is not the same as previous run (${compareGtfsTimer.get()})`);
		}
		catch (error) {
			LOGGER.error('Error while comparing GTFS hashes (Step 1.2.)', error);
		}

		//

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

		if (ENABLED_MODULES.includes('timetables_parser')) {
			console.log();
			console.log('STEP 1.8: Parse Timetables');
			await timetablesParser();
		}

		//

		await SERVERDB.disconnect();
		await NETWORKDB.disconnect();

		console.log();
		console.log('------------------------');
		// console.log(`Run took ${getElapsedTime(startTime)}.`);
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
