/* * */

import { NETWORKDB, SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

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

	allDatesData.sort((a, b) => sortCollator.compare(a.date, b.date));
	await SERVERDB.set(SERVERDB_KEYS.NETWORK.DATES, JSON.stringify(allDatesData));

	LOGGER.success(`Done updating ${updatedDatesCounter} Dates (${globalTimer.get()})`);

	//
};
