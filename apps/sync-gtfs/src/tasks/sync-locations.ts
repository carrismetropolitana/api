/* * */

import type { Locality } from '@carrismetropolitana/api-types/locations';

import { NETWORKDB } from '@carrismetropolitana/api-services/NETWORKDB';
import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { createHash } from 'node:crypto';

/* * */

export const syncLocations = async () => {
	//

	LOGGER.title(`Sync Locations`);
	const globalTimer = new TIMETRACKER();

	//
	// Fetch all unique Localities, Municipalities, Districts and Regions from NETWORKDB

	const queryResult = await NETWORKDB.client.query(`
		SELECT DISTINCT ON (locality, municipality_id, municipality_name, district_id, district_name, region_id, region_name)
			locality,
			municipality_id,
			municipality_name,
			district_id,
			district_name,
			region_id,
			region_name
		FROM stops;
	`);

	//
	// For each item, update its entry in the database

	const updatedLocalitiesData = new Map<string, Locality>();
	let updatedLocalitiesCounter = 0;

	for (const queryResultRow of queryResult.rows) {
		//

		//
		// Localities are identified by their unique hash from the display string.
		// The display string is a combination of the locality and municipality name, separated by a comma.
		// However, if the locality is the same as the municipality, then the locality should be skipped.

		if (queryResultRow.locality && queryResultRow.locality !== queryResultRow.municipality_name) {
			//

			const localityDisplayString = `${queryResultRow.locality}, ${queryResultRow.municipality_name}`;

			const localityId = createHash('sha256').update(localityDisplayString).digest('hex');

			if (updatedLocalitiesData.has(localityId)) {
				continue;
			}

			const localityData: Locality = {
				display: localityDisplayString,
				district_id: queryResultRow.district_id,
				id: localityId,
				municipality_id: queryResultRow.municipality_id,
				name: queryResultRow.locality,
				region_id: queryResultRow.region_id,
			};

			updatedLocalitiesData.set(localityId, localityData);
			updatedLocalitiesCounter++;

			//
		}

		//
	}

	//
	// Save data to the database

	const sortedLocalitiesData = Array.from(updatedLocalitiesData.values()).sort((a, b) => sortCollator.compare(a.id, b.id));
	await SERVERDB.set(SERVERDB_KEYS.LOCATIONS.LOCALIITIES, JSON.stringify(sortedLocalitiesData));

	//

	LOGGER.success(`Updated ${updatedLocalitiesCounter} Localities in ${globalTimer.get()}`);

	//
};
