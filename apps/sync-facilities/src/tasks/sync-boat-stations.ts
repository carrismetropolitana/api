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

	const downloadedSourceFile = await fetch(DATASET_FILE_URL);
	const downloadedSourceText = await downloadedSourceFile.text();
	const allSourceItems = Papa.parse<BoatStationsSource>(downloadedSourceText, { header: true });

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
	const allUpdatedItemsData: BoatStation[] = [];

	for (const sourceItem of allSourceItems.data) {
		//

		//
		// Discover which Location this store is in.
		// Try to match the store's locality first, then fallback to municipality.

		let matchingLocation: Location = allLocalitiesData.find((item: Locality) => item.locality_name === sourceItem.locality && item.municipality_id === sourceItem.municipality_id);

		if (!matchingLocation) {
			matchingLocation = allMunicipalitiesData.find((item: Municipality) => item.municipality_id === sourceItem.municipality_id);
		}

		//
		// Format position

		const formatedPosition = {
			latitude: parseFloat(sourceItem.lat),
			longitude: parseFloat(sourceItem.lon),
		};

		//
		// Build the final object

		const updatedItemData: BoatStation = {
			boat_station_id: sourceItem.id,
			location: matchingLocation,
			name: sourceItem.name,
			position: formatedPosition,
			stop_ids: sourceItem.stops?.length ? sourceItem.stops.split('|') : [],
		};

		allUpdatedItemsData.push(updatedItemData);

		updatedItemsCounter++;

		//
	}

	//
	// Save items to the database

	allUpdatedItemsData.sort((a, b) => sortCollator.compare(a.boat_station_id, b.boat_station_id));
	await SERVERDB.set(SERVERDB_KEYS.FACILITIES.BOAT_STATIONS, JSON.stringify(allUpdatedItemsData));

	LOGGER.success(`Done updating ${updatedItemsCounter} items to ${SERVERDB_KEYS.FACILITIES.BOAT_STATIONS} (${globalTimer.get()}).`);

	//
};
