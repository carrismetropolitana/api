/* * */

import settings from '@/config/settings.js';
import collator from '@/modules/sortCollator.js';
import timeCalc from '@/modules/timeCalc.js';
import SERVERDB from '@/services/SERVERDB.js';
import fs from 'fs';
import Papa from 'papaparse';

/* * */

export default async () => {
	//
	// 1.
	// Record the start time to later calculate operation duration
	const startTime = process.hrtime();

	// 2.
	// Open file from cloned repository
	console.log(`⤷ Opening data file...`);
	const allItemsRaw = fs.readFileSync(`${settings.BASE_DIR}/facilities/pip/pip.csv`, { encoding: 'utf-8' });
	const allItemsCsv = Papa.parse(allItemsRaw, { header: true });

	// 3.
	// Initate a temporary variable to hold updated items
	const allItemsData = [];
	const updatedItemKeys = new Set();

	// 4.
	// Log progress
	console.log(`⤷ Updating items...`);

	// 5.
	// For each facility, update its entry in the database
	for (const itemCsv of allItemsCsv.data) {
		// Parse item
		const parsedItemData = {
			district_id: itemCsv.district_id,
			district_name: itemCsv.district_name,
			id: itemCsv.id,
			lat: itemCsv.lat,
			locality: itemCsv.locality,
			lon: itemCsv.lon,
			municipality_id: itemCsv.municipality_id,
			municipality_name: itemCsv.municipality_name,
			name: itemCsv.name,
			region_id: itemCsv.region_id,
			region_name: itemCsv.region_name,
			stops: itemCsv.stops?.length ? itemCsv.stops.split('|') : [],
		};
		// Save to database
		allItemsData.push(parsedItemData);
		await SERVERDB.client.set(`datasets/facilities/pip/${parsedItemData.id}`, JSON.stringify(parsedItemData));
		updatedItemKeys.add(`datasets/facilities/pip/${parsedItemData.id}`);
		//
	}

	// 6.
	// Log count of updated items
	console.log(`⤷ Updated ${updatedItemKeys.size} items.`);

	// 7.
	// Add the 'all' option
	allItemsData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.client.set('datasets/facilities/pip/all', JSON.stringify(allItemsData));
	updatedItemKeys.add('datasets/facilities/pip/all');

	// 8.
	// Delete all items not present in the current update
	const allSavedItemKeys = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'datasets/facilities/pip/*', TYPE: 'string' })) {
		allSavedItemKeys.push(key);
	}
	const staleItemKeys = allSavedItemKeys.filter(id => !updatedItemKeys.has(id));
	if (staleItemKeys.length) await SERVERDB.client.del(staleItemKeys);
	console.log(`⤷ Deleted ${staleItemKeys.length} stale items.`);

	// 9.
	// Log elapsed time in the current operation
	const elapsedTime = timeCalc.getElapsedTime(startTime);
	console.log(`⤷ Done updating items (${elapsedTime}).`);

	//
};
