/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings/src/constants.js';
import { Locality, Municipality } from '@carrismetropolitana/api-types/src/api';
import { StoreMetadata, StoresSource } from '@carrismetropolitana/api-types/src/stores/stores.js';
import { sortCollator } from '@carrismetropolitana/api-utils/src/sortCollator.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/latest/facilities/encm/encm.csv';

/* * */

export const syncMetadata = async () => {
	//

	LOGGER.title(`SYNC METADATA`);
	const globalTimer = new TIMETRACKER();

	//
	// Download and parse the data file

	LOGGER.info(`Downloading data file...`);

	const downloadedCsvFile = await fetch(DATASET_FILE_URL);
	const downloadedCsvText = await downloadedCsvFile.text();
	const allItemsCsv = Papa.parse<StoresSource>(downloadedCsvText, { header: true });

	//
	// Fetch all Locations from SERVERDB

	const allLocalitiesTxt = await SERVERDB.get(SERVERDB_KEYS.LOCATIONS.LOCALIITIES);
	const allLocalitiesData = JSON.parse(allLocalitiesTxt);

	const allMunicipalitiesTxt = await SERVERDB.get(SERVERDB_KEYS.LOCATIONS.MUNICIPALITIES);
	const allMunicipalitiesData = JSON.parse(allMunicipalitiesTxt);

	//
	// For each item, update its entry in the database

	const allItemsData: StoreMetadata[] = [];
	let updatedItemsCounter = 0;

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
		// Build the final store object

		const parsedItemData: StoreMetadata = {
			address: itemCsv.address,
			brand_name: itemCsv.brand_name,
			email: itemCsv.email,
			google_place_id: itemCsv.google_place_id,
			hours_friday: itemCsv.hours_friday?.length ? itemCsv.hours_friday.split('|') : [],
			hours_monday: itemCsv.hours_monday?.length ? itemCsv.hours_monday.split('|') : [],
			hours_saturday: itemCsv.hours_saturday?.length ? itemCsv.hours_saturday.split('|') : [],
			hours_special: itemCsv.hours_special,
			hours_sunday: itemCsv.hours_sunday?.length ? itemCsv.hours_sunday.split('|') : [],
			hours_thursday: itemCsv.hours_thursday?.length ? itemCsv.hours_thursday.split('|') : [],
			hours_tuesday: itemCsv.hours_tuesday?.length ? itemCsv.hours_tuesday.split('|') : [],
			hours_wednesday: itemCsv.hours_wednesday?.length ? itemCsv.hours_wednesday.split('|') : [],
			lat: parseFloat(itemCsv.lat),
			location: matchingLocation,
			lon: parseFloat(itemCsv.lon),
			name: itemCsv.name,
			phone: itemCsv.phone,
			postal_code: itemCsv.postal_code,
			short_name: itemCsv.short_name,
			stop_ids: itemCsv.stops?.length ? itemCsv.stops.split('|') : [],
			store_id: itemCsv.id,
			url: itemCsv.url,
		};

		allItemsData.push(parsedItemData);

		updatedItemsCounter++;

		//
	}

	//
	// Save items to the database

	allItemsData.sort((a, b) => sortCollator.compare(a.store_id, b.store_id));
	await SERVERDB.set(SERVERDB_KEYS.FACILITIES.STORES, JSON.stringify(allItemsData));

	LOGGER.success(`Done updating ${updatedItemsCounter} items to ${SERVERDB_KEYS.FACILITIES.STORES} (${globalTimer.get()}).`);

	//
};
