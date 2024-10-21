/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { StoreMetadata, StoresSource } from '@carrismetropolitana/api-types/src/api/facilities.js';
import { sortCollator } from '@carrismetropolitana/api-utils/src/sortCollator.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/latest/connections/encm/encm.csv';

/* * */

export const syncMetadata = async () => {
	//

	LOGGER.title(`Sync Stores Metadata`);
	const globalTimer = new TIMETRACKER();

	//
	// Download and parse the data file

	LOGGER.info(`Downloading data file...`);

	const downloadedSourceFile = await fetch(DATASET_FILE_URL);
	const downloadedSourceText = await downloadedSourceFile.text();
	const allSourceItems = Papa.parse<StoresSource>(downloadedSourceText, { header: true });

	//
	// For each item, update its entry in the database

	LOGGER.info(`Updating items...`);

	let updatedItemsCounter = 0;
	const allUpdatedItemsData: StoreMetadata[] = [];

	for (const sourceItem of allSourceItems.data) {
		//

		const updatedItemData: StoreMetadata = {
			address: sourceItem.address,
			district_id: sourceItem.district_id,
			district_name: sourceItem.district_name,
			email: sourceItem.email,
			google_place_id: sourceItem.google_place_id,
			hours_friday: sourceItem.hours_friday?.length ? sourceItem.hours_friday.split('|') : [],
			hours_monday: sourceItem.hours_monday?.length ? sourceItem.hours_monday.split('|') : [],
			hours_saturday: sourceItem.hours_saturday?.length ? sourceItem.hours_saturday.split('|') : [],
			hours_special: sourceItem.hours_special,
			hours_sunday: sourceItem.hours_sunday?.length ? sourceItem.hours_sunday.split('|') : [],
			hours_thursday: sourceItem.hours_thursday?.length ? sourceItem.hours_thursday.split('|') : [],
			hours_tuesday: sourceItem.hours_tuesday?.length ? sourceItem.hours_tuesday.split('|') : [],
			hours_wednesday: sourceItem.hours_wednesday?.length ? sourceItem.hours_wednesday.split('|') : [],
			id: sourceItem.id,
			lat: Number(sourceItem.lat),
			locality: sourceItem.locality,
			lon: Number(sourceItem.lon),
			municipality_id: sourceItem.municipality_id,
			municipality_name: sourceItem.municipality_name,
			name: sourceItem.name,
			parish_id: sourceItem.parish_id,
			parish_name: sourceItem.parish_name,
			phone: sourceItem.phone,
			postal_code: sourceItem.postal_code,
			region_id: sourceItem.region_id,
			region_name: sourceItem.region_name,
			short_name: sourceItem.short_name,
			stop_ids: sourceItem.stops?.length ? sourceItem.stops.split('|') : [],
			url: sourceItem.url,
		};

		allUpdatedItemsData.push(updatedItemData);

		updatedItemsCounter++;

		//
	}

	//
	// Save items to the database

	allUpdatedItemsData.sort((a, b) => sortCollator.compare(a.id, b.id));
	await SERVERDB.set(SERVERDB_KEYS.FACILITIES.STORES, JSON.stringify(allUpdatedItemsData));

	LOGGER.success(`Done updating ${updatedItemsCounter} items to ${SERVERDB_KEYS.FACILITIES.STORES} (${globalTimer.get()}).`);

	//
};
