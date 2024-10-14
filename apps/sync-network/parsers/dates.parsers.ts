/* * */

import collator from '@/modules/sortCollator.js';
import NETWORKDB from '@/services/NETWORKDB.js';
import { SERVERDB } from '@api/services';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

export default async () => {
	//

	const globalTimer = new TIMETRACKER();

	//
	// Fetch all Dates from NETWORKDB

	LOGGER.info(`Starting...`);
	const allDates = await NETWORKDB.client.query('SELECT * FROM dates');

	//
	// Initate a temporary variable to hold updated items

	const allDatesData = [];
	const updatedDateKeys = new Set();

	//
	// For each item, update its entry in the database

	for (const date of allDates.rows) {
		// Parse date
		const parsedDate = {
			date: date.date,
			day_type: date.day_type,
			description: date.description,
			holiday: date.holiday,
			period: date.period,
		};
		// Update or create new document
		allDatesData.push(parsedDate);
		await SERVERDB.client.set(`v2:network:dates:${parsedDate.date}`, JSON.stringify(parsedDate));
		updatedDateKeys.add(`v2:network:dates:${parsedDate.date}`);
	}

	LOGGER.info(`Updated ${updatedDateKeys.size} Dates`);

	//
	// Add the 'all' option

	allDatesData.sort((a, b) => collator.compare(a.date, b.date));
	await SERVERDB.client.set('v2:network:dates:all', JSON.stringify(allDatesData));
	updatedDateKeys.add('v2:network:dates:all');

	//
	// Delete all items not present in the current update

	const allSavedDateKeys = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'v2:network:dates:*', TYPE: 'string' })) {
		allSavedDateKeys.push(key);
	}

	const staleDateKeys = allSavedDateKeys.filter(date => !updatedDateKeys.has(date));
	if (staleDateKeys.length) {
		await SERVERDB.client.del(staleDateKeys);
	}

	LOGGER.info(`Deleted ${staleDateKeys.length} stale Dates`);

	//

	LOGGER.success(`Done updating Dates (${globalTimer.get()})`);

	//
};
