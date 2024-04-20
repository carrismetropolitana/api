/* * */

import NETWORKDB from '../services/NETWORKDB';
import SERVERDB from '../services/SERVERDB';
import { getElapsedTime } from '../modules/timeCalc';
import collator from '../modules/sortCollator';

/* * */

export default async () => {
	//
	// 1.
	// Record the start time to later calculate operation duration
	const startTime = process.hrtime();

	// 2.
	// Fetch all Dates from Postgres
	console.log(`⤷ Querying database...`);
	const allDates = await NETWORKDB.connection.query('SELECT * FROM dates');

	// 3.
	// Initate a temporary variable to hold updated Dates
	const allDatesData = [];
	const updatedDateKeys = new Set;

	// 4.
	// Log progress
	console.log(`⤷ Updating Dates...`);

	// 5.
	// For each date, update its entry in the database
	for (const date of allDates.rows) {
		// Parse date
		const parsedDate = {
			date: date.date,
			period: date.period,
			day_type: date.day_type,
			holiday: date.holiday,
			description: date.description,
		};
		// Update or create new document
		allDatesData.push(parsedDate);
		await SERVERDB.client.set(`dates:${parsedDate.date}`, JSON.stringify(parsedDate));
		updatedDateKeys.add(`dates:${parsedDate.date}`);
	}

	// 6.
	// Log count of updated Dates
	console.log(`⤷ Updated ${updatedDateKeys.size} Dates.`);

	// 7.
	// Add the 'all' option
	allDatesData.sort((a, b) => collator.compare(a.date, b.date));
	await SERVERDB.client.set('dates:all', JSON.stringify(allDatesData));
	updatedDateKeys.add('dates:all');

	// 8.
	// Delete all Dates not present in the current update
	const allSavedDateKeys = [];
	for await (const key of SERVERDB.client.scanIterator({ TYPE: 'string', MATCH: 'dates:*' })) {
		allSavedDateKeys.push(key);
	}
	const staleDateKeys = allSavedDateKeys.filter(date => !updatedDateKeys.has(date));
	if (staleDateKeys.length) await SERVERDB.client.del(staleDateKeys);
	console.log(`⤷ Deleted ${staleDateKeys.length} stale Dates.`);

	// 9.
	// Log elapsed time in the current operation
	const elapsedTime = getElapsedTime(startTime);
	console.log(`⤷ Done updating Dates (${elapsedTime}).`);

	//
};