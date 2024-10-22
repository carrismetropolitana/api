/* * */

import { GtfsFile } from '@/config/files.js';
import { NETWORKDB } from '@carrismetropolitana/api-services/NETWORKDB';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { CsvWriter } from '@helperkits/writer';
import { parse } from 'csv-parse';
import fs from 'node:fs';
import { from as copyFrom } from 'pg-copy-streams';

/* * */

export default async function (preparedDirPath: string, rawFilePath: string, gtfsFile: GtfsFile) {
	//

	LOGGER.spacer(1);
	LOGGER.info(`Importing "${gtfsFile._key}"...`);

	const globalTimer = new TIMETRACKER();

	//
	// Recreate database table from scratch
	// This is done by dropping the table if it exists, and then creating it again.
	// As the table is only temporary, we don't need to worry about data loss.
	// Evertyhing is re-imported anyway from GTFS.

	const rebuildTableTimer = new TIMETRACKER();

	await NETWORKDB.client.query(`DROP TABLE IF EXISTS ${gtfsFile._key};`);
	await NETWORKDB.client.query(gtfsFile.table_query);

	for (const indexQuery of gtfsFile.index_queries) {
		await NETWORKDB.client.query(indexQuery);
	}

	LOGGER.success(`Rebuilt "${gtfsFile._key}" SQL table (${rebuildTableTimer.get()})`);

	//
	// Setup a new instance of the batch CSV writer as well as path variables
	// used across this function. Using a batch writer avoids memory issues (instead of loading the entire file into memory)
	// as well as improves performance because it reduces the amount of disk operations (instead of saving line by line).

	const preparedFilePath = `${preparedDirPath}/${gtfsFile._key}.${gtfsFile.extension}`;

	const csvWriter = new CsvWriter(gtfsFile._key, preparedFilePath, { batch_size: 1000000 });

	//
	// Prepare the file.
	// To do this, we read the raw file using csv-parse library (because it allows streaming),
	// then we transform the file to exactly match the table format (including column order),
	// and then we save it to a new file in the prepared directory using a batch writer.

	const prepareFileTimer = new TIMETRACKER();

	const rawFileStream = fs.createReadStream(rawFilePath).pipe(parse({ bom: true, columns: true, ignore_last_delimiters: true, skip_empty_lines: true, trim: true }));

	let preparedRowsCount = 0;

	for await (const rawFileRow of rawFileStream) {
		const preparedFileRow = {};
		gtfsFile.headers.forEach((headerKey) => {
			preparedFileRow[headerKey] = rawFileRow[headerKey];
		});
		await csvWriter.write(preparedFileRow);
		preparedRowsCount++;
	}

	await csvWriter.flush();

	LOGGER.success(`Prepared "${gtfsFile._key}" file (${preparedRowsCount} rows in ${prepareFileTimer.get()})`);

	//
	// Import the file to the SQL table.
	// This is done by using the pg-copy-streams library to stream the file directly into the database.

	const importFileTimer = new TIMETRACKER();

	const preparedFileStream = fs.createReadStream(preparedFilePath);
	const sqlImportStream = NETWORKDB.client.query(copyFrom(`COPY ${gtfsFile._key} FROM STDIN CSV HEADER DELIMITER ',' QUOTE '"'`));

	const importFileResult = await new Promise<{ rowCount: number }>((resolve, reject) => {
		preparedFileStream
			.pipe(sqlImportStream)
			.on('finish', () => resolve(sqlImportStream))
			.on('error', reject);
	});

	LOGGER.success(`Imported "${gtfsFile._key}" file to NETWORKDB (${importFileResult.rowCount} rows in ${importFileTimer.get()})`);

	//

	LOGGER.success(`Prepare and Import complete for "${gtfsFile._key}" file (${globalTimer.get()})`);

	//
}
