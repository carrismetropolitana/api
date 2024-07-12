/* * */

import collator from '@/modules/sortCollator.js';
import NETWORKDB from '@/services/NETWORKDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

export default async () => {
	//

	const globalTimer = new TIMETRACKER();

	//
	// Fetch all Municipalities from NETWORKDB

	LOGGER.info(`Querying database...`);
	const allMunicipalities = await NETWORKDB.client.query('SELECT * FROM municipalities');

	//
	// Initate a temporary variable to hold updated items

	const allMunicipalitiesData = [];
	const updatedMunicipalityKeys = new Set();

	//
	// For each municipality, update its entry in the database

	for (const municipality of allMunicipalities.rows) {
		// Parse municipality
		const parsedMunicipality = {
			district_id: municipality.district_id,
			district_name: municipality.district_name,
			id: municipality.municipality_id,
			name: municipality.municipality_name,
			prefix: municipality.municipality_prefix,
			region_id: municipality.region_id,
			region_name: municipality.region_name,
		};
		// Update or create new document
		allMunicipalitiesData.push(parsedMunicipality);
		await SERVERDB.client.set(`municipalities:${parsedMunicipality.id}`, JSON.stringify(parsedMunicipality));
		updatedMunicipalityKeys.add(`municipalities:${parsedMunicipality.id}`);
	}

	LOGGER.info(`Updated ${updatedMunicipalityKeys.size} Municipalities`);

	//
	// Add the 'all' option

	allMunicipalitiesData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.client.set('municipalities:all', JSON.stringify(allMunicipalitiesData));
	updatedMunicipalityKeys.add('municipalities:all');

	//
	// Delete all Municipalities not present in the current update

	const allSavedMunicipalityKeys: string[] = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'municipalities:*', TYPE: 'string' })) {
		allSavedMunicipalityKeys.push(key);
	}

	const staleMunicipalityKeys = allSavedMunicipalityKeys.filter(id => !updatedMunicipalityKeys.has(id));
	if (staleMunicipalityKeys.length) {
		await SERVERDB.client.del(staleMunicipalityKeys);
	}

	LOGGER.info(`Deleted ${staleMunicipalityKeys.length} stale Municipalities`);

	//

	LOGGER.success(`Done updating Municipalities (${globalTimer.get()})`);

	//
};
