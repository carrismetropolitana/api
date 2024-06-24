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
	const allSchoolsRaw = fs.readFileSync(`${settings.BASE_DIR}/facilities/schools/schools.csv`, { encoding: 'utf-8' });
	const allSchoolsCsv = Papa.parse(allSchoolsRaw, { header: true });

	// 3.
	// Log progress
	console.log(`⤷ Updating Schools...`);

	// 4.
	// Initate a temporary variable to hold updated Schools
	const allSchoolsData = [];
	const updatedSchoolKeys = new Set();

	// 5.
	// For each school, update its entry in the database
	for (const schoolData of allSchoolsCsv.data) {
		// Discover which cicles this school has
		const cicles = [];
		const possibleCicles = ['pre_school', 'basic_1', 'basic_2', 'basic_3', 'high_school', 'professional', 'special', 'artistic', 'university', 'other'];
		for (const cicle of possibleCicles) {
			if (schoolData[cicle] === '1') cicles.push(cicle);
		}
		// Split stops into discrete IDs
		let parsedSchoolStops = [];
		if (schoolData.stops?.length) parsedSchoolStops = schoolData.stops.split('|');
		// Initiate a variable to hold the parsed school
		const parsedSchool = {
			address: schoolData.address,
			cicles: cicles,
			district_id: schoolData.district_id,
			district_name: schoolData.district_name,
			email: schoolData.email,
			grouping: schoolData.grouping,
			id: schoolData.id,
			lat: schoolData.lat,
			locality: schoolData.locality,
			lon: schoolData.lon,
			municipality_id: schoolData.municipality_id,
			municipality_name: schoolData.municipality_name,
			name: schoolData.name,
			nature: schoolData.nature,
			parish_id: schoolData.parish_id,
			parish_name: schoolData.parish_name,
			phone: schoolData.phone,
			postal_code: schoolData.postal_code,
			region_id: schoolData.region_id,
			region_name: schoolData.region_name,
			stops: parsedSchoolStops,
			url: schoolData.url,
		};
		// Update or create new document
		allSchoolsData.push(parsedSchool);
		await SERVERDB.client.set(`datasets/facilities/schools/${parsedSchool.id}`, JSON.stringify(parsedSchool));
		updatedSchoolKeys.add(`datasets/facilities/schools/${parsedSchool.id}`);
		//
	}

	// 6.
	// Log count of updated Schools
	console.log(`⤷ Updated ${updatedSchoolKeys.size} Schools.`);

	// 7.
	// Add the 'all' option
	allSchoolsData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.client.set('datasets/facilities/schools/all', JSON.stringify(allSchoolsData));
	updatedSchoolKeys.add('datasets/facilities/schools/all');

	// 8.
	// Delete all Schools not present in the current update
	const allSavedSchoolKeys = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'datasets/facilities/schools/*', TYPE: 'string' })) {
		allSavedSchoolKeys.push(key);
	}
	const staleSchoolKeys = allSavedSchoolKeys.filter(id => !updatedSchoolKeys.has(id));
	if (staleSchoolKeys.length) await SERVERDB.client.del(staleSchoolKeys);
	console.log(`⤷ Deleted ${staleSchoolKeys.length} stale Schools.`);

	// 9.
	// Log elapsed time in the current operation
	const elapsedTime = timeCalc.getElapsedTime(startTime);
	console.log(`⤷ Done updating Schools (${elapsedTime}).`);

	//
};
