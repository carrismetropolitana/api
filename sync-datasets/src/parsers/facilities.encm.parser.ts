/* * */

import SERVERDB from '@/services/SERVERDB.js';
import collator from '@/services/sortCollator.js';
import TIMETRACKER from '@helperkits/timer';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/latest/facilities/encm/encm.csv';

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
			active_counters: 0,
			address: itemCsv.address,
			brand_name: itemCsv.brand_name,
			current_ratio: 0,
			current_status: 'unknown',
			currently_waiting: 0,
			district_id: itemCsv.district_id,
			district_name: itemCsv.district_name,
			email: itemCsv.email,
			expected_wait_time: 0,
			google_place_id: itemCsv.google_place_id,
			hours_friday: itemCsv.hours_friday?.length ? itemCsv.hours_friday.split('|') : [],
			hours_monday: itemCsv.hours_monday?.length ? itemCsv.hours_monday.split('|') : [],
			hours_saturday: itemCsv.hours_saturday?.length ? itemCsv.hours_saturday.split('|') : [],
			hours_special: itemCsv.hours_special,
			hours_sunday: itemCsv.hours_sunday?.length ? itemCsv.hours_sunday.split('|') : [],
			hours_thursday: itemCsv.hours_thursday?.length ? itemCsv.hours_thursday.split('|') : [],
			hours_tuesday: itemCsv.hours_tuesday?.length ? itemCsv.hours_tuesday.split('|') : [],
			hours_wednesday: itemCsv.hours_wednesday?.length ? itemCsv.hours_wednesday.split('|') : [],
			id: itemCsv.id,
			is_open: false,
			lat: itemCsv.lat,
			locality: itemCsv.locality,
			lon: itemCsv.lon,
			municipality_id: itemCsv.municipality_id,
			municipality_name: itemCsv.municipality_name,
			name: itemCsv.name,
			parish_id: itemCsv.parish_id,
			parish_name: itemCsv.parish_name,
			phone: itemCsv.phone,
			postal_code: itemCsv.postal_code,
			region_id: itemCsv.region_id,
			region_name: itemCsv.region_name,
			short_name: itemCsv.short_name,
			stops: itemCsv.stops?.length ? itemCsv.stops.split('|') : [],
			url: itemCsv.url,
		};
		// Save to database
		allItemsData.push(parsedItemData);
		await SERVERDB.client.set(`v2:datasets:facilities:encm:${parsedItemData.id}`, JSON.stringify(parsedItemData));
		updatedItemKeys.add(`v2:datasets:facilities:encm:${parsedItemData.id}`);
		//
	}

	// 4.
	// Log count of updated items

	console.log(`⤷ Updated ${updatedItemKeys.size} items.`);

	// 5.
	// Add the 'all' option

	allItemsData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.client.set('v2:datasets:facilities:encm:all', JSON.stringify(allItemsData));
	updatedItemKeys.add('v2:datasets:facilities:encm:all');

	// 6.
	// Delete all items not present in the current update

	const allSavedItemKeys = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'v2:datasets:facilities:encm:*', TYPE: 'string' })) {
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
