/* * */

import collator from '@/modules/sortCollator.js';
import { NETWORKDB } from '@carrismetropolitana/api-services';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { createHash } from 'node:crypto';

/* * */

export default async () => {
	//

	const globalTimer = new TIMETRACKER();

	//
	// Fetch all unique Localities, Municipalities from NETWORKDB

	LOGGER.info(`Starting...`);
	const allLocalities = await NETWORKDB.client.query(`
		SELECT DISTINCT ON (locality, municipality_id, municipality_name)
			locality,
			municipality_id,
			municipality_name
		FROM stops;
	`);

	//
	// Initate a temporary variable to hold updated items

	const allLocalitiesData = [];
	const updatedLocalityKeys = new Set();

	//
	// For each item, update its entry in the database

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
		// Initiate a variable to hold the parsed locality
		const parsedLocality = {
			display: displayString,
			id: hash.digest('hex'),
			locality: localityData.locality,
			municipality_id: localityData.municipality_id,
			municipality_name: localityData.municipality_name,
		};
		// Update or create new document
		allLocalitiesData.push(parsedLocality);
		await SERVERDB.set(`${SERVERDB_KEYS.NETWORK.LOCALITIES}:${parsedLocality.id}`, JSON.stringify(parsedLocality));
		updatedLocalityKeys.add(`${SERVERDB_KEYS.NETWORK.LOCALITIES}:${parsedLocality.id}`);
	}

	LOGGER.info(`Updated ${updatedLocalityKeys.size} Localities`);

	//
	// Add the 'all' option

	allLocalitiesData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.set(`${SERVERDB_KEYS.NETWORK.LOCALITIES}:all`, JSON.stringify(allLocalitiesData));
	updatedLocalityKeys.add(`${SERVERDB_KEYS.NETWORK.LOCALITIES}:all`);

	// 8.
	// Delete all items not present in the current update

	const allSavedStopKeys = [];
	for await (const key of await SERVERDB.scanIterator({ MATCH: `${SERVERDB_KEYS.NETWORK.LOCALITIES}:*`, TYPE: 'string' })) {
		allSavedStopKeys.push(key);
	}

	const staleLocalityKeys = allSavedStopKeys.filter(id => !updatedLocalityKeys.has(id));
	if (staleLocalityKeys.length) {
		await SERVERDB.del(staleLocalityKeys);
	}

	LOGGER.info(`Deleted ${staleLocalityKeys.length} stale Localities`);

	//

	LOGGER.success(`Done updating Localities (${globalTimer.get()})`);

	//
};
