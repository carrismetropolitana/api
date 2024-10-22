/* * */

import { NETWORKDB, SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { District, Locality, Municipality, Region } from '@carrismetropolitana/api-types/locations';
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

	const updatedMunicipalitiesData = new Map<string, Municipality>();
	let updatedMunicipalitiesCounter = 0;

	const updatedDistrictsData = new Map<string, District>();
	let updatedDistrictsCounter = 0;

	const updatedRegionsData = new Map<string, Region>();
	let updatedRegionsCounter = 0;

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
				district_name: queryResultRow.district_name,
				locality_id: localityId,
				locality_name: queryResultRow.locality,
				municipality_id: queryResultRow.municipality_id,
				municipality_name: queryResultRow.municipality_name,
				region_id: queryResultRow.region_id,
				region_name: queryResultRow.region_name,
			};

			updatedLocalitiesData.set(localityId, localityData);
			updatedLocalitiesCounter++;

			//
		}

		//
		// Municipalities are identified by their unique ID, which is the COS ID.

		const municipalityId = queryResultRow.municipality_id;

		if (!updatedMunicipalitiesData.has(municipalityId)) {
			const municipalityData: Municipality = {
				district_id: queryResultRow.district_id,
				district_name: queryResultRow.district_name,
				municipality_id: municipalityId,
				municipality_name: queryResultRow.municipality_name,
				region_id: queryResultRow.region_id,
				region_name: queryResultRow.region_name,
			};

			updatedMunicipalitiesData.set(municipalityId, municipalityData);
			updatedMunicipalitiesCounter++;
		}

		//
		// Districts are identified by their unique ID, which is the COS ID.

		const districtId = queryResultRow.district_id;

		if (!updatedDistrictsData.has(districtId)) {
			const districtData: District = {
				district_id: districtId,
				district_name: queryResultRow.district_name,
				region_id: queryResultRow.region_id,
				region_name: queryResultRow.region_name,
			};

			updatedDistrictsData.set(districtId, districtData);
			updatedDistrictsCounter++;
		}

		//
		// Regions are identified by their unique ID, which is the COS ID.

		const regionId = queryResultRow.region_id;

		if (!updatedRegionsData.has(regionId)) {
			const regionData: Region = {
				region_id: regionId,
				region_name: queryResultRow.region_name,
			};

			updatedRegionsData.set(regionId, regionData);
			updatedRegionsCounter++;
		}

		//
	}

	//
	// Save data to the database

	const sortedLocalitiesData = Array.from(updatedLocalitiesData.values()).sort((a, b) => sortCollator.compare(a.locality_id, b.locality_id));
	await SERVERDB.set(SERVERDB_KEYS.LOCATIONS.LOCALIITIES, JSON.stringify(sortedLocalitiesData));

	const sortedMunicipalitiesData = Array.from(updatedMunicipalitiesData.values()).sort((a, b) => sortCollator.compare(a.municipality_id, b.municipality_id));
	await SERVERDB.set(SERVERDB_KEYS.LOCATIONS.MUNICIPALITIES, JSON.stringify(sortedMunicipalitiesData));

	const sortedDistrictsData = Array.from(updatedDistrictsData.values()).sort((a, b) => sortCollator.compare(a.district_id, b.district_id));
	await SERVERDB.set(SERVERDB_KEYS.LOCATIONS.DISTRICTS, JSON.stringify(sortedDistrictsData));

	const sortedRegionsData = Array.from(updatedRegionsData.values()).sort((a, b) => sortCollator.compare(a.region_id, b.region_id));
	await SERVERDB.set(SERVERDB_KEYS.LOCATIONS.REGIONS, JSON.stringify(sortedRegionsData));

	//

	LOGGER.success(`Updated ${updatedLocalitiesCounter} Localities, ${updatedMunicipalitiesCounter} Municipalities, ${updatedDistrictsCounter} Districts and ${updatedRegionsCounter} Regions in ${globalTimer.get()}`);

	//
};
