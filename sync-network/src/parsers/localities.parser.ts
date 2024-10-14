/* * */

import collator from '@/modules/sortCollator.js';
import NETWORKDB from '@/services/NETWORKDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { createHash } from 'node:crypto';

/* * */

const REDIS_BASE_KEY = 'v2:network:localities';

/* * */

export const syncLocalities = async () => {
	//

	LOGGER.title(`Sync Localities`);
	const globalTimer = new TIMETRACKER();

	//
	// Fetch all unique Localities, Municipalities from NETWORKDB

	const allLocalities = await NETWORKDB.client.query(`
		SELECT DISTINCT ON (locality, municipality_id, municipality_name)
			locality,
			municipality_id,
			municipality_name
		FROM stops;
	`);

	//
	// For each item, update its entry in the database

	const allLocalitiesData = [];
	let updatedLocalitiesCounter = 0;

	for (const localityData of allLocalities.rows) {
		// Skip if the locality is the same as the municipality
		if (!localityData.locality || localityData.locality === localityData.municipality_name) {
			continue;
		}
		// Setup the display string for this locality
		const displayString = `${localityData.locality}, ${localityData.municipality_name}`;
		// Setup a unique ID for this locality
		const hash = createHash('sha256');
		hash.update(displayString);
		//
		const parsedLocality = {
			display: displayString,
			id: hash.digest('hex'),
			locality: localityData.locality,
			municipality_id: localityData.municipality_id,
			municipality_name: localityData.municipality_name,
		};
		//
		allLocalitiesData.push(parsedLocality);
		//
		updatedLocalitiesCounter++;
	}

	//
	// Save to the database

	allLocalitiesData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.client.set(`${REDIS_BASE_KEY}:all`, JSON.stringify(allLocalitiesData));

	LOGGER.success(`Done updating ${updatedLocalitiesCounter} Localities (${globalTimer.get()})`);

	//
};
