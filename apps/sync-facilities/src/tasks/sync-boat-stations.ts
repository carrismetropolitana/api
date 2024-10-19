/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { Locality, Location, Municipality } from '@carrismetropolitana/api-types/src/api';
import { BoatStation, BoatStationsSource } from '@carrismetropolitana/api-types/src/facilities/facilities.js';
import { sortCollator } from '@carrismetropolitana/api-utils/src/sortCollator.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/latest/connections/boat_stations/boat_stations.csv';

/* * */

export const syncBoatStations = async () => {
	//

	LOGGER.title(`Sync Boat Stations`);
	const globalTimer = new TIMETRACKER();

	//
	// Download and parse the data file

	LOGGER.info(`Downloading data file...`);

	const downloadedCsvFile = await fetch(DATASET_FILE_URL);
	const downloadedCsvText = await downloadedCsvFile.text();
	const allItemsCsv = Papa.parse<BoatStationsSource>(downloadedCsvText, { header: true });

	//
	// Fetch all Locations from SERVERDB

	const allLocalitiesTxt = await SERVERDB.get(SERVERDB_KEYS.LOCATIONS.LOCALIITIES);
	const allLocalitiesData = JSON.parse(allLocalitiesTxt);

	const allMunicipalitiesTxt = await SERVERDB.get(SERVERDB_KEYS.LOCATIONS.MUNICIPALITIES);
	const allMunicipalitiesData = JSON.parse(allMunicipalitiesTxt);

	//
	// For each item, update its entry in the database

	LOGGER.info(`Updating items...`);

	let updatedItemsCounter = 0;
	const allItemsData: BoatStation[] = [];

	for (const itemCsv of allItemsCsv.data) {
		//

		//
		// Discover which Location this store is in.
		// Try to match the store's locality first, then fallback to municipality.

		let matchingLocation: Location = allLocalitiesData.find((item: Locality) => item.locality_name === itemCsv.locality && item.municipality_id === itemCsv.municipality_id);

		if (!matchingLocation) {
			matchingLocation = allMunicipalitiesData.find((item: Municipality) => item.municipality_id === itemCsv.municipality_id);
		}

		//
		// Build the final object

		const parsedItemData: BoatStation = {
			boat_station_id: itemCsv['id'],
			lat: itemCsv['lat'],
			location: matchingLocation,
			lon: itemCsv['lon'],
			name: itemCsv['name'],
			stop_ids: itemCsv['stops']?.length ? itemCsv['stops'].split('|') : [],
		};

		allItemsData.push(parsedItemData);

		updatedItemsCounter++;

		//
	}

	//
	// Save items to the database

	allItemsData.sort((a, b) => sortCollator.compare(a.boat_station_id, b.boat_station_id));
	await SERVERDB.set(SERVERDB_KEYS.FACILITIES.STORES, JSON.stringify(allItemsData));

	LOGGER.success(`Done updating ${updatedItemsCounter} items to ${SERVERDB_KEYS.FACILITIES.BOAT_STATIONS} (${globalTimer.get()}).`);

	//
};
