/* * */

import collator from '@/services/sortCollator.js';
import { SERVERDB } from '@api/services';
import TIMETRACKER from '@helperkits/timer';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/latest/connections/subway_stations/subway_stations.csv';

/* * */

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
		await SERVERDB.client.set(`v2:datasets:connections:subway_stations:${parsedItemData.id}`, JSON.stringify(parsedItemData));
		updatedItemKeys.add(`v2:datasets:connections:subway_stations:${parsedItemData.id}`);
		//
	}

	// 4.
	// Log count of updated items

	console.log(`⤷ Updated ${updatedItemKeys.size} items.`);

	// 5.
	// Add the 'all' option

	allItemsData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.client.set('v2:datasets:connections:subway_stations:all', JSON.stringify(allItemsData));
	updatedItemKeys.add('v2:datasets:connections:subway_stations:all');

	// 6.
	// Delete all items not present in the current update

	const allSavedItemKeys = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'v2:datasets:connections:subway_stations:*', TYPE: 'string' })) {
		allSavedItemKeys.push(key);
	}
	const staleItemKeys = allSavedItemKeys.filter(id => !updatedItemKeys.has(id));
	if (staleItemKeys.length) {
		await SERVERDB.client.del(staleItemKeys);
	}
	console.log(`⤷ Deleted ${staleItemKeys.length} stale items.`);

	// 7.
	// Log elapsed time in the current operation

	console.log(`⤷ Done updating items (${globalTimer.get()}).`);

	//
};
