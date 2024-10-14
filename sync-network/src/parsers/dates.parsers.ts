/* * */

import collator from '@/modules/sortCollator.js';
import NETWORKDB from '@/services/NETWORKDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

const REDIS_BASE_KEY = 'v2:network:dates';

/* * */

export const syncDates = async () => {
	//

	LOGGER.title(`Sync Dates`);
	const globalTimer = new TIMETRACKER();

	//
	// Fetch all Dates from NETWORKDB

	const allDates = await NETWORKDB.client.query('SELECT * FROM dates');

	//
	// For each item, update its entry in the database

	const allDatesData = [];
	let updatedDatesCounter = 0;

	for (const date of allDates.rows) {
		//
		const parsedDate = {
			date: date.date,
			day_type: date.day_type,
			description: date.description,
			holiday: date.holiday,
			period: date.period,
		};
		//
		allDatesData.push(parsedDate);
		//
		updatedDatesCounter++;
		//
	}

	//
	// Save to the database

	allDatesData.sort((a, b) => collator.compare(a.date, b.date));
	await SERVERDB.client.set(`${REDIS_BASE_KEY}:all`, JSON.stringify(allDatesData));

	LOGGER.success(`Done updating ${updatedDatesCounter} Dates (${globalTimer.get()})`);

	//
};
