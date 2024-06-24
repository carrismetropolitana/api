/* * */

import settings from '@/config/settings.js';
import timeCalc from '@/modules/timeCalc.js';
import SERVERDB from '@/services/SERVERDB.js';
import fs from 'fs';
import Papa from 'papaparse';

/* * */

export default async () => {
	//

	const startTime = process.hrtime();
	console.log(`⤷ Parsing datasets/demand/date-line-stop...`);

	// Read directory from cloned repository
	const allDirectoryFilenames = fs.readdirSync(`${settings.BASE_DIR}/demand/date-line-stop`, { encoding: 'utf-8' });

	//
	console.log(`⤷ Parsing "viewByDateForEachStop"...`);
	await viewByDateForEachStop(allDirectoryFilenames);

	//
	console.log(`⤷ Parsing "viewByDateForEachLine"...`);
	await viewByDateForEachLine(allDirectoryFilenames);

	//
	console.log(`⤷ Parsing "viewByDateForEachStopForEachLine"...`);
	await viewByDateForEachStopForEachLine(allDirectoryFilenames);

	// Log elapsed time in the current operation
	const elapsedTime = timeCalc.getElapsedTime(startTime);
	console.log(`⤷ Done updating datasets/demand/date-line-stop (${elapsedTime}).`);

	//
};

/* * */

async function viewByDateForEachStop(allFilenames) {
	// Setup result variable
	const result = {};
	// Open each file from directory
	for (const filename of allFilenames) {
		// Open and parse file
		const fileDataRaw = fs.readFileSync(`${settings.BASE_DIR}/demand/date-line-stop/${filename}`, { encoding: 'utf-8' });
		const fileDataCsv = Papa.parse(fileDataRaw, { header: true });
		// Parse file contents
		fileDataCsv.data.forEach((row) => {
			// Skip if no row data
			if (!row || !row.date || !row.line_id || !row.stop_id) return;
			// Create an entry for the current date if it was not seen before
			if (!result[row.date]) result[row.date] = {};
			// Create an entry for the current stop_id if it was not seen before
			if (!result[row.date][row.stop_id]) result[row.date][row.stop_id] = 0;
			// If the date and stop_id combination was seen before, add the validations value
			result[row.date][row.stop_id] += Number(row.validations);
			//
		});
		//
	}
	// Save the result to the database
	await SERVERDB.client.set('datasets/demand/date-line-stop/viewByDateForEachStop', JSON.stringify(result));
	//
}

/* * */

async function viewByDateForEachLine(allFilenames) {
	// Setup result variable
	const result = {};
	// Open each file from directory
	for (const filename of allFilenames) {
		// Open and parse file
		const fileDataRaw = fs.readFileSync(`${settings.BASE_DIR}/demand/date-line-stop/${filename}`, { encoding: 'utf-8' });
		const fileDataCsv = Papa.parse(fileDataRaw, { header: true });
		// Parse file contents
		fileDataCsv.data.forEach((row) => {
			// Skip if no row data
			if (!row || !row.date || !row.line_id || !row.stop_id) return;
			// Create an entry for the current date if it was not seen before
			if (!result[row.date]) result[row.date] = {};
			// Create an entry for the current line_id if it was not seen before
			if (!result[row.date][row.line_id]) result[row.date][row.line_id] = 0;
			// If the date and line_id combination was seen before, add the validations value
			result[row.date][row.line_id] += Number(row.validations);
			//
		});
		//
	}
	// Save the result to the database
	await SERVERDB.client.set('datasets/demand/date-line-stop/viewByDateForEachLine', JSON.stringify(result));
	//
}

/* * */

async function viewByDateForEachStopForEachLine(allFilenames) {
	// Setup result variable
	const result = {};
	// Open each file from directory
	for (const filename of allFilenames) {
		// Open and parse file
		const fileDataRaw = fs.readFileSync(`${settings.BASE_DIR}/demand/date-line-stop/${filename}`, { encoding: 'utf-8' });
		const fileDataCsv = Papa.parse(fileDataRaw, { header: true });
		// Parse file contents
		fileDataCsv.data.forEach((row) => {
			// Skip if no row data
			if (!row || !row.date || !row.line_id || !row.stop_id) return;
			// Create an entry for the current date if it was not seen before
			if (!result[row.date]) result[row.date] = {};
			// Create an entry for the current stop_id if it was not seen before
			if (!result[row.date][row.stop_id]) result[row.date][row.stop_id] = {};
			// Create an entry for the current line_id if it was not seen before
			if (!result[row.date][row.stop_id][row.line_id]) result[row.date][row.stop_id][row.line_id] = 0;
			// If the date and stop_id and line_id combination was seen before, add the validations value
			result[row.date][row.stop_id][row.line_id] += Number(row.validations);
			//
		});
		//
	}
	// Save the result to the database
	await SERVERDB.client.set('datasets/demand/date-line-stop/viewByDateForEachStopForEachLine', JSON.stringify(result));
	//
}
