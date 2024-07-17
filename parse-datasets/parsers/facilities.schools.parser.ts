/* * */

import SERVERDB from '@/services/SERVERDB.js';
import collator from '@/services/sortCollator.js';
import TIMETRACKER from '@helperkits/timer';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/latest/facilities/schools/schools.csv';

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
		// Discover which cicles this school has
		const cicles = [];
		const possibleCicles = ['pre_school', 'basic_1', 'basic_2', 'basic_3', 'high_school', 'professional', 'special', 'artistic', 'university', 'other'];
		for (const cicle of possibleCicles) {
			if (itemCsv[cicle] === '1') cicles.push(cicle);
		}
		// Split stops into discrete IDs
		let parsedSchoolStops = [];
		if (itemCsv.stops?.length) parsedSchoolStops = itemCsv.stops.split('|');
		// Initiate a variable to hold the parsed school
		const parsedItemData = {
			address: itemCsv.address,
			cicles: cicles,
			district_id: itemCsv.district_id,
			district_name: itemCsv.district_name,
			email: itemCsv.email,
			grouping: itemCsv.grouping,
			id: itemCsv.id,
			lat: itemCsv.lat,
			locality: itemCsv.locality,
			lon: itemCsv.lon,
			municipality_id: itemCsv.municipality_id,
			municipality_name: itemCsv.municipality_name,
			name: itemCsv.name,
			nature: itemCsv.nature,
			parish_id: itemCsv.parish_id,
			parish_name: itemCsv.parish_name,
			phone: itemCsv.phone,
			postal_code: itemCsv.postal_code,
			region_id: itemCsv.region_id,
			region_name: itemCsv.region_name,
			stops: parsedSchoolStops,
			url: itemCsv.url,
		};
		// Save to database
		allItemsData.push(parsedItemData);
		await SERVERDB.client.set(`v2/datasets/facilities/schools/${parsedItemData.id}`, JSON.stringify(parsedItemData));
		updatedItemKeys.add(`v2/datasets/facilities/schools/${parsedItemData.id}`);
		//
	}

	// 4.
	// Log count of updated items

	console.log(`⤷ Updated ${updatedItemKeys.size} items.`);

	// 5.
	// Add the 'all' option

	allItemsData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.client.set('v2/datasets/facilities/schools/all', JSON.stringify(allItemsData));
	updatedItemKeys.add('v2/datasets/facilities/schools/all');

	// 6.
	// Delete all items not present in the current update

	const allSavedItemKeys = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'v2/datasets/facilities/schools/*', TYPE: 'string' })) {
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
