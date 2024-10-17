/* * */

import collator from '@/services/sortCollator.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import TIMETRACKER from '@helperkits/timer';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/refs/heads/latest/sla/sla.csv';

/* * */

interface LineData {
	agencyId: string
	lineId: string
	operationalDay: string
	passTripCount: number
	passTripPercentage: number
	totalTripCount: number
}

export default async () => {
	//

	// 1.
	// Record the start time to later calculate operation duration

	const globalTimer = new TIMETRACKER();

	// 2.
	// Open file from cloned repository

	console.log(`⤷ Downloading data file...`);
	const downloadedCsvFile = await fetch(DATASET_FILE_URL);
	const downloadedCsvText = await downloadedCsvFile.text();
	const allItemsCsv = Papa.parse(downloadedCsvText, { header: true });

	// 3.
	// For each item, update its entry in the database

	console.log(`⤷ Updating items...`);

	const allItemsData = [];
	const updatedItemKeys = new Set();
	const lines = new Map<string, LineData[]>();

	interface CsvItem {
		agency_id: string
		line_id: string
		operational_day: string
		pass_trip_count: number
		pass_trip_percentage: number
		total_trip_count: number
	}

	for (const itemCsv of allItemsCsv.data as CsvItem[]) {
		// Parse item
		const parsedItemData: LineData = {
			agencyId: itemCsv['agency_id'],
			lineId: itemCsv['line_id'],
			operationalDay: itemCsv['operational_day'],
			passTripCount: itemCsv['pass_trip_count'],
			passTripPercentage: itemCsv['pass_trip_percentage'],
			totalTripCount: itemCsv['total_trip_count'],
		};

		// Save to database
		allItemsData.push(parsedItemData);

		// Save by line:operational_day
		await SERVERDB.set(`${SERVERDB_KEYS.METRICS.SERVICE}:${parsedItemData.lineId}:${parsedItemData.operationalDay}`, JSON.stringify(parsedItemData));

		// Save by Line
		const savedLineData = lines.get(parsedItemData.lineId) || [];
		savedLineData.push(parsedItemData);
		lines.set(parsedItemData.lineId, savedLineData);

		updatedItemKeys.add(`${SERVERDB_KEYS.METRICS.SERVICE}:${parsedItemData.lineId}:${parsedItemData.operationalDay}`);
		//
	}

	//
	// Save all lines

	console.log(`⤷ Saving lines...`);

	for (const [lineId, lineData] of lines) {
		await SERVERDB.set(`${SERVERDB_KEYS.METRICS.SERVICE}:${lineId}:all`, JSON.stringify(lineData));
	}

	// 4.
	// Log count of updated items

	console.log(`⤷ Updated ${updatedItemKeys.size} items.`);

	// 5.
	// Add the 'all' option

	allItemsData.sort((a, b) => collator.compare(a.lineId, b.lineId));
	await SERVERDB.set(`${SERVERDB_KEYS.METRICS.SERVICE}:all`, JSON.stringify(allItemsData));
	updatedItemKeys.add(`${SERVERDB_KEYS.METRICS.SERVICE}:all`);

	// 6.
	// Delete all items not present in the current update

	const allSavedItemKeys = [];
	for await (const key of await SERVERDB.scanIterator({ MATCH: `${SERVERDB_KEYS.METRICS.SERVICE}/*`, TYPE: 'string' })) {
		allSavedItemKeys.push(key);
	}
	const staleItemKeys = allSavedItemKeys.filter(id => !updatedItemKeys.has(id));
	if (staleItemKeys.length) {
		await SERVERDB.del(staleItemKeys);
	}
	console.log(`⤷ Deleted ${staleItemKeys.length} stale items.`);

	// 7.
	// Log elapsed time in the current operation

	console.log(`⤷ Done updating items (${globalTimer.get()}).`);

	//
};
