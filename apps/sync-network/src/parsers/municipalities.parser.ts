/* * */

import collator from '@/modules/sortCollator.js';
import NETWORKDB from '@/services/NETWORKDB.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

export default async () => {
	//

	const globalTimer = new TIMETRACKER();

	//
	// Fetch all Municipalities from NETWORKDB

	LOGGER.info(`Starting...`);
	const allMunicipalities = await NETWORKDB.client.query('SELECT * FROM municipalities');

	//
	// Initate a temporary variable to hold updated items

	const allMunicipalitiesData = [];
	const updatedMunicipalityKeys = new Set();

	//
	// For each item, update its entry in the database

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
		await SERVERDB.client.set(`v2:network:municipalities:${parsedMunicipality.id}`, JSON.stringify(parsedMunicipality));
		updatedMunicipalityKeys.add(`v2:network:municipalities:${parsedMunicipality.id}`);
	}

	LOGGER.info(`Updated ${updatedMunicipalityKeys.size} Municipalities`);

	//
	// Add the 'all' option

	allMunicipalitiesData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.client.set('v2:network:municipalities:all', JSON.stringify(allMunicipalitiesData));
	updatedMunicipalityKeys.add('v2:network:municipalities:all');

	//
	// Delete all items not present in the current update

	const allSavedMunicipalityKeys: string[] = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'v2:network:municipalities:*', TYPE: 'string' })) {
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
