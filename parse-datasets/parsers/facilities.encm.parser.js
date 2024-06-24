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
	const allEncmRaw = fs.readFileSync(`${settings.BASE_DIR}/facilities/encm/encm.csv`, { encoding: 'utf-8' });
	const allEncmCsv = Papa.parse(allEncmRaw, { header: true });

	// 3.
	// Initate a temporary variable to hold updated ENCM
	const allEncmData = [];
	const updatedEncmKeys = new Set();

	// 4.
	// Log progress
	console.log(`⤷ Updating ENCM...`);

	// 5.
	// For each facility, update its entry in the database
	for (const encmData of allEncmCsv.data) {
		// Parse encm
		const parsedEncm = {
			active_counters: 0,
			address: encmData.address,
			currently_waiting: 0,
			district_id: encmData.district_id,
			district_name: encmData.district_name,
			email: encmData.email,
			expected_wait_time: 0,
			hours_friday: encmData.hours_friday?.length ? encmData.hours_friday.split('|') : [],
			hours_monday: encmData.hours_monday?.length ? encmData.hours_monday.split('|') : [],
			hours_saturday: encmData.hours_saturday?.length ? encmData.hours_saturday.split('|') : [],
			hours_special: encmData.hours_special,
			hours_sunday: encmData.hours_sunday?.length ? encmData.hours_sunday.split('|') : [],
			hours_thursday: encmData.hours_thursday?.length ? encmData.hours_thursday.split('|') : [],
			hours_tuesday: encmData.hours_tuesday?.length ? encmData.hours_tuesday.split('|') : [],
			hours_wednesday: encmData.hours_wednesday?.length ? encmData.hours_wednesday.split('|') : [],
			id: encmData.id,
			is_open: false,
			lat: encmData.lat,
			locality: encmData.locality,
			lon: encmData.lon,
			municipality_id: encmData.municipality_id,
			municipality_name: encmData.municipality_name,
			name: encmData.name,
			parish_id: encmData.parish_id,
			parish_name: encmData.parish_name,
			phone: encmData.phone,
			postal_code: encmData.postal_code,
			region_id: encmData.region_id,
			region_name: encmData.region_name,
			stops: encmData.stops?.length ? encmData.stops.split('|') : [],
			url: encmData.url,
		};
		// Save to database
		allEncmData.push(parsedEncm);
		await SERVERDB.client.set(`datasets/facilities/encm/${parsedEncm.id}`, JSON.stringify(parsedEncm));
		updatedEncmKeys.add(`datasets/facilities/encm/${parsedEncm.id}`);
		//
	}

	// 6.
	// Log count of updated ENCM
	console.log(`⤷ Updated ${updatedEncmKeys.size} ENCM.`);

	// 7.
	// Add the 'all' option
	allEncmData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.client.set('datasets/facilities/encm/all', JSON.stringify(allEncmData));
	updatedEncmKeys.add('datasets/facilities/encm/all');

	// 8.
	// Delete all ENCM not present in the current update
	const allSavedEncmKeys = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'datasets/facilities/encm/*', TYPE: 'string' })) {
		allSavedEncmKeys.push(key);
	}
	const staleEncmKeys = allSavedEncmKeys.filter(id => !updatedEncmKeys.has(id));
	if (staleEncmKeys.length) await SERVERDB.client.del(staleEncmKeys);
	console.log(`⤷ Deleted ${staleEncmKeys.length} stale ENCM.`);

	// 9.
	// Log elapsed time in the current operation
	const elapsedTime = timeCalc.getElapsedTime(startTime);
	console.log(`⤷ Done updating ENCM (${elapsedTime}).`);

	//
};
