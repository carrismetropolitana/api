/* * */

import collator from '@/services/sortCollator.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import TIMETRACKER from '@helperkits/timer';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/latest/connections/subway_stations/subway_stations.csv';

/* * */

export const syncSubwayStations = async () => {
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

	for (const itemCsv of allItemsCsv.data) {
		// Parse item
		const parsedItemData = {
			district_id: itemCsv['district_id'],
			district_name: itemCsv['district_name'],
			id: itemCsv['id'],
			lat: itemCsv['lat'],
			locality: itemCsv['locality'],
			lon: itemCsv['lon'],
			municipality_id: itemCsv['municipality_id'],
			municipality_name: itemCsv['municipality_name'],
			name: itemCsv['name'],
			parish_id: itemCsv['parish_id'],
			parish_name: itemCsv['parish_name'],
			region_id: itemCsv['region_id'],
			region_name: itemCsv['region_name'],
			stops: itemCsv['stops']?.length ? itemCsv['stops'].split('|') : [],
		};
		// Save to database
		allItemsData.push(parsedItemData);
		await SERVERDB.set(`${SERVERDB_KEYS.DATASETS.CONNECTIONS_SUBWAY_STATIONS}:${parsedItemData.id}`, JSON.stringify(parsedItemData));
		updatedItemKeys.add(`${SERVERDB_KEYS.DATASETS.CONNECTIONS_SUBWAY_STATIONS}:${parsedItemData.id}`);
		//
	}

	// 4.
	// Log count of updated items

	console.log(`⤷ Updated ${updatedItemKeys.size} items.`);

	// 5.
	// Add the 'all' option

	allItemsData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.set(`${SERVERDB_KEYS.DATASETS.CONNECTIONS_SUBWAY_STATIONS}:all`, JSON.stringify(allItemsData));
	updatedItemKeys.add(`${SERVERDB_KEYS.DATASETS.CONNECTIONS_SUBWAY_STATIONS}:all`);

	// 6.
	// Delete all items not present in the current update

	const allSavedItemKeys = [];
	for await (const key of await SERVERDB.scanIterator({ MATCH: `${SERVERDB_KEYS.DATASETS.CONNECTIONS_SUBWAY_STATIONS}:*`, TYPE: 'string' })) {
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
