/* * */

import { existsSync, mkdirSync, writeFileSync, createReadStream, appendFileSync } from 'fs';
import { connection } from '../services/NETWORKDB';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify/sync';
import { from as copyFrom } from 'pg-copy-streams';
import { getElapsedTime } from './timeCalc';

/* * */

export default async FILE_OPTIONS => {
	//

	console.log(`⤷ Importing "${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}"...`);

	// Drop existing table
	await connection.query(`DROP TABLE IF EXISTS ${FILE_OPTIONS.file_name};`);
	console.log(`⤷ Dropped existing SQL table "${FILE_OPTIONS.file_name}".`);

	// Create table
	await connection.query(FILE_OPTIONS.table_query);
	console.log(`⤷ Created SQL table "${FILE_OPTIONS.file_name}".`);

	// Create indexes
	for (const indexQuery of FILE_OPTIONS.index_queries) {
		await connection.query(indexQuery);
		console.log(`⤷ Created index on SQL table "${FILE_OPTIONS.file_name}".`);
	}

	// Create prepared directory if it does not already exist
	if (!existsSync(FILE_OPTIONS.prepared_dir)) {
		console.log(`⤷ Creating directory "${FILE_OPTIONS.prepared_dir}"...`);
		mkdirSync(FILE_OPTIONS.prepared_dir);
	}

	// Prepare file
	await prepareFile(FILE_OPTIONS);

	// Import to table
	await importFileToTable(FILE_OPTIONS);

	console.log();

	//
};

/* * */

// Parse the files first
async function prepareFile(FILE_OPTIONS: { prepared_dir: any; file_name: any; file_extension: any; file_headers: any[]; raw_dir: any; }) {
	const startTime = process.hrtime();
	console.log(`⤷ Creating file "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}"...`);
	const headersString = FILE_OPTIONS.file_headers.join(',');
	writeFileSync(`${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`, headersString + '\n');
	console.log(`⤷ Preparing "${FILE_OPTIONS.raw_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}" to "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}"...`);
	const parserStream = createReadStream(`${FILE_OPTIONS.raw_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`).pipe(parse({ columns: true, trim: true, skip_empty_lines: true, ignore_last_delimiters: true, bom: true }));
	let rowCount = 0;
	for await (const rowObject of parserStream) {
		const rowArray = [];
		for (const key of FILE_OPTIONS.file_headers) {
			const colString = rowObject[key];
			rowArray.push(colString);
		}
		const rowString = stringify([rowArray]);
		appendFileSync(`${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`, rowString);
		rowCount++;
	}
	const elapsedTime = getElapsedTime(startTime);
	console.log(`⤷ Prepared "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}" (${rowCount} rows in ${elapsedTime})`);
	//
}

/* * */

// LOAD files into the database
async function importFileToTable(FILE_OPTIONS: { prepared_dir: string; file_name: string; file_extension: string; }) {
	const startTime = process.hrtime();
	console.log(`⤷ Importing "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}" to "${FILE_OPTIONS.file_name}" table...`);
	// Setup the query and a filesystem connection using 'pg-copy-streams' and 'fs'
	const stream = connection.query(copyFrom(`COPY ${FILE_OPTIONS.file_name} FROM STDIN CSV HEADER DELIMITER ',' QUOTE '"'`));
	const fileStream = createReadStream(`${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`);
	// Pipe the contents of the file into the pg-copy-stream function
	const { rowCount } = await new Promise<{ rowCount: number }>((resolve, reject) => {
		fileStream
			.pipe(stream)
			.on('finish', () => resolve(stream))
			.on('error', reject);
	});
	const elapsedTime = getElapsedTime(startTime);
	console.log(`⤷ Saved "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}" to "${FILE_OPTIONS.file_name}" table (${rowCount} rows in ${elapsedTime})`);
}