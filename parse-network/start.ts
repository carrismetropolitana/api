/* * */

import allGtfsFiles from '@/config/files.js';
import createHashFromFile from '@/modules/createHashFromFile.js';
import normalizeDirectoryPermissions from '@/modules/normalizeDirectoryPermissions.js';
import prepareAndImportFile from '@/modules/prepareAndImportFile.js';
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
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import extract from 'extract-zip';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';

/* * */

let LAST_GTFS_HASH = null;

/* * */

const RAW_DIR_PATH = '/tmp/raw';
const RAW_FILE_PATH = `${RAW_DIR_PATH}/gtfs.zip`;
const PREPARED_DIR_PATH = `/tmp/prepared`;

/* * */

export const ENABLED_MODULES = [
	'gtfs_import',
	'municipalities_parser',
	'localities_parser',
	'periods_parser',
	'dates_parser',
	// 'archives_parser',
	// 'stops_parser',
	// 'shapes_parser',
	// 'lines_routes_patterns_parser',
	// 'timetables_parser',
];

/* * */

export default async () => {
	try {
		//

		LOGGER.init();
		const globalTimer = new TIMETRACKER();

		/* * */

		LOGGER.spacer(1);
		LOGGER.title('1. Fetching latest GTFS...');
		const importGtfsTimer = new TIMETRACKER();

		//
		// Prepare working directories

		fs.rmSync(RAW_DIR_PATH, { force: true, recursive: true });
		fs.mkdirSync(RAW_DIR_PATH, { recursive: true });

		//
		// Import GTFS from source
		// Source can either be a URL or a local file

		if (process.env.GTFS_URL.startsWith('file://')) {
			// If the source is a local file
			LOGGER.info(`Copying file from "${process.env.GTFS_URL}"...`);
			const normalizedSourceFilePath = process.env.GTFS_URL.replace('file://', '');
			fs.copyFileSync(normalizedSourceFilePath, RAW_FILE_PATH);
		}
		else {
			// If the source is a URL
			LOGGER.info(`Downloading file from "${process.env.GTFS_URL}"...`);
			const stream = fs.createWriteStream(RAW_FILE_PATH);
			const response: Response = await fetch(process.env.GTFS_URL);
			// @ts-expect-error Readable.fromWeb actually accepts a ReadableStream<Uint8Array>, even though we are mixing nodejs and web ReadableStreams
			await finished(Readable.fromWeb(response.body).pipe(stream));
		}

		LOGGER.success(`Done fetching latest GTFS (${importGtfsTimer.get()})`);

		//
		// Compare GTFS hash to determine if we need to proceed

		const currentGtfsHash = await createHashFromFile(RAW_FILE_PATH);

		if (LAST_GTFS_HASH === currentGtfsHash) {
			LOGGER.terminate(`Skipping this run as latest GTFS is the same as previous run (${globalTimer.get()})`);
			return;
		}

		LAST_GTFS_HASH = currentGtfsHash;

		LOGGER.info('Latest GTFS is not the same as previous run. Proceeding...');

		/* * */

		if (ENABLED_MODULES.includes('gtfs_import')) {
			LOGGER.spacer(1);
			LOGGER.title('2. Unzip, prepare and import each GTFS file...');

			//
			// Extract GTFS archive into prepared directory
			// and normalize directory permissions

			await extract(RAW_FILE_PATH, { dir: RAW_DIR_PATH });
			normalizeDirectoryPermissions(RAW_DIR_PATH);

			LOGGER.success('Done extracting GTFS archive and normalizing directory permissions');

			//
			// For each file, eliminate unwanted columns and normalize their positions.
			// This is required to use a special import command that expects a CSV file
			// to have the exact same structure as the table it is being imported into.
			// Even though this may seem wasteful, it dramatically speeds up the import process.

			fs.rmSync(PREPARED_DIR_PATH, { force: true, recursive: true });
			fs.mkdirSync(PREPARED_DIR_PATH, { recursive: true });

			for (const fileOptions of allGtfsFiles) {
				const rawFilePath = `${RAW_DIR_PATH}/${fileOptions._key}.${fileOptions.extension}`;
				await prepareAndImportFile(PREPARED_DIR_PATH, rawFilePath, fileOptions);
			}

			LOGGER.success('Done preparing and importing GTFS files');

			//
		}

		/* * */

		if (ENABLED_MODULES.includes('municipalities_parser')) {
			LOGGER.spacer(1);
			LOGGER.title('3.1. Parse Municipalities');
			await municipalitiesParser();
		}

		/* * */

		if (ENABLED_MODULES.includes('localities_parser')) {
			LOGGER.spacer(1);
			LOGGER.title('3.2. Parse Localities');
			await localitiesParser();
		}

		/* * */

		if (ENABLED_MODULES.includes('periods_parser')) {
			LOGGER.spacer(1);
			LOGGER.title('3.3. Parse Periods');
			await periodsParser();
		}

		/* * */

		if (ENABLED_MODULES.includes('dates_parser')) {
			console.log();
			console.log('STEP 1.4: Parse Dates');
			await datesParser();
		}

		/* * */

		if (ENABLED_MODULES.includes('archives_parser')) {
			console.log();
			console.log('STEP 1.4: Parse Archives');
			await archivesParser();
		}

		/* * */

		if (ENABLED_MODULES.includes('stops_parser')) {
			console.log();
			console.log('STEP 1.5: Parse Stops');
			await stopsParser();
		}

		/* * */

		if (ENABLED_MODULES.includes('shapes_parser')) {
			console.log();
			console.log('STEP 1.6: Parse Shapes');
			await shapesParser();
		}

		/* * */

		if (ENABLED_MODULES.includes('lines_routes_patterns_parser')) {
			console.log();
			console.log('STEP 1.7: Parse Lines, Routes and Patterns');
			await linesRoutesPatternsParser();
		}

		/* * */

		if (ENABLED_MODULES.includes('lines_routes_patterns_parser')) {
			console.log();
			console.log('STEP 1.7.1: NEW Parse Lines, Routes and Patterns');
			await newLinesRoutesPatternsParser();
		}

		/* * */

		if (ENABLED_MODULES.includes('timetables_parser')) {
			console.log();
			console.log('STEP 1.8: Parse Timetables');
			await timetablesParser();
		}

		//

		LOGGER.terminate(`Run complete (${globalTimer.get()})`);

		//
	}
	catch (err) {
		console.log('An error occurred. Halting execution.', err);
		return false;
	}

	//
};
