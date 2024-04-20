/* * */

import { existsSync, mkdirSync, writeFileSync, createReadStream, readFileSync, appendFileSync } from 'fs';
import NETWORKDB from '../services/NETWORKDB';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify/sync';
import { from as copyFrom } from 'pg-copy-streams';
import { getElapsedTime } from './timeCalc';
import Papa from 'papaparse';

/* * */

export default async FILE_OPTIONS => {
	//

	console.log(`⤷ Importing "${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}"...`);

	// Drop existing table
	await NETWORKDB.connection.query(`DROP TABLE IF EXISTS ${FILE_OPTIONS.file_name};`);
	console.log(`⤷ Dropped existing SQL table "${FILE_OPTIONS.file_name}".`);

	// Create table
	await NETWORKDB.connection.query(FILE_OPTIONS.table_query);
	console.log(`⤷ Created SQL table "${FILE_OPTIONS.file_name}".`);

	// Create indexes
	for (const indexQuery of FILE_OPTIONS.index_queries) {
		await NETWORKDB.connection.query(indexQuery);
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function prepareFile(FILE_OPTIONS: { prepared_dir: string; file_name: string; file_extension: string; file_headers: string[]; raw_dir: string; }) {
	const startTime = process.hrtime();
	console.log(`⤷ Creating file "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}"...`);
	const headersString = FILE_OPTIONS.file_headers.join(',');
	writeFileSync(`${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`, headersString + '\n');
	const fileLines = [headersString + '\n'];
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
		// fileLines.push(rowString);
		rowCount++;
	}
	console.log(`⤷ Done transforming file in ${getElapsedTime(startTime)}`);
	// writeFileSync(`${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`, fileLines.join(''));
	const elapsedTime = getElapsedTime(startTime);
	console.log(`⤷ Prepared "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}" (${rowCount} rows in ${elapsedTime})`);
	//
}

// Parse the files first
async function prepareFilePapaparseSync(FILE_OPTIONS: { prepared_dir: string; file_name: string; file_extension: string; file_headers: string[]; raw_dir: string; }) {
	const startTime = process.hrtime();
	const newFilePath = `${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`;
	const oldFilePath = `${FILE_OPTIONS.raw_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`;
	console.log(`⤷ Creating file "${newFilePath}"...`);
	// console.log(`⤷ Creating file "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}"...`);
	console.log(`⤷ Preparing "${oldFilePath}" to "${newFilePath}"...`);
	const k = Papa.parse(readFileSync(`${FILE_OPTIONS.raw_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`, 'utf8'), {
		header: true,
		skipEmptyLines: true,
	});
	const headersString = FILE_OPTIONS.file_headers.join(',');
	const outputLines = [headersString];
	for (const line of k.data) {
		const outputArray = [];
		for (const key of FILE_OPTIONS.file_headers) {
			let colString = line[key];
			if (colString == undefined) {
				colString = '';
			} else if (colString.includes(',')) {
				colString = `"${colString}"`;
			}
			outputArray.push(colString);
		}
		outputLines.push(outputArray.join(','));
	}
	// Can't use papa unparse because it allocates all of node's memory :D
	// const output = Papa.unparse(outputLines);
	const output = outputLines.join('\n');

	writeFileSync(`${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}`, output);

	const elapsedTime = getElapsedTime(startTime);
	console.log(`⤷ Prepared "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}" (${outputLines.length} rows in ${elapsedTime})`);
	//
}

/* * */

// LOAD files into the database
async function importFileToTable(FILE_OPTIONS: { prepared_dir: string; file_name: string; file_extension: string; }) {
	const startTime = process.hrtime();
	console.log(`⤷ Importing "${FILE_OPTIONS.prepared_dir}/${FILE_OPTIONS.file_name}.${FILE_OPTIONS.file_extension}" to "${FILE_OPTIONS.file_name}" table...`);
	// Setup the query and a filesystem NETWORKDB.connection using 'pg-copy-streams' and 'fs'
	const stream = NETWORKDB.connection.query(copyFrom(`COPY ${FILE_OPTIONS.file_name} FROM STDIN CSV HEADER DELIMITER ',' QUOTE '"'`));
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