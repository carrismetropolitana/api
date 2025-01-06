/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { Store, StoresSource } from '@carrismetropolitana/api-types/facilities';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/latest/facilities/encm/encm.csv';

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

	const allUpdatedItemsData: Store[] = [];

	for (const sourceItem of allSourceItems.data) {
		//

		const updatedItemData: Store = {

			//
			// Metadata

			brand_name: sourceItem.brand_name,
			district_id: sourceItem.district_id,
			district_name: sourceItem.district_name,
			id: sourceItem.id,
			lat: Number(sourceItem.lat),
			locality: sourceItem.locality,
			lon: Number(sourceItem.lon),
			municipality_id: sourceItem.municipality_id,
			municipality_name: sourceItem.municipality_name,
			name: sourceItem.name,
			parish_id: sourceItem.parish_id,
			parish_name: sourceItem.parish_name,
			region_id: sourceItem.region_id,
			region_name: sourceItem.region_name,
			short_name: sourceItem.short_name,
			stop_ids: sourceItem.stops?.length ? sourceItem.stops.split('|') : [],

			//
			// Contacts

			contacts: {
				address: sourceItem.address,
				email: sourceItem.email,
				google_place_id: sourceItem.google_place_id,
				phone: sourceItem.phone,
				postal_code: sourceItem.postal_code,
				url: sourceItem.url,
			},

			//
			// Opening hours

			hours: {
				friday: sourceItem.hours_friday?.length ? sourceItem.hours_friday.split('|') : [],
				monday: sourceItem.hours_monday?.length ? sourceItem.hours_monday.split('|') : [],
				saturday: sourceItem.hours_saturday?.length ? sourceItem.hours_saturday.split('|') : [],
				special: sourceItem.hours_special,
				sunday: sourceItem.hours_sunday?.length ? sourceItem.hours_sunday.split('|') : [],
				thursday: sourceItem.hours_thursday?.length ? sourceItem.hours_thursday.split('|') : [],
				tuesday: sourceItem.hours_tuesday?.length ? sourceItem.hours_tuesday.split('|') : [],
				wednesday: sourceItem.hours_wednesday?.length ? sourceItem.hours_wednesday.split('|') : [],
			},

			//
			// Realtime data

			realtime: null,

		};

		allUpdatedItemsData.push(updatedItemData);

		//
	}

	//
	// Save items to the database

	allUpdatedItemsData.sort((a, b) => sortCollator.compare(a.id, b.id));
	await SERVERDB.set(SERVERDB_KEYS.FACILITIES.STORES, JSON.stringify(allUpdatedItemsData));

	LOGGER.success(`Done updating ${allUpdatedItemsData.length} items to ${SERVERDB_KEYS.FACILITIES.STORES} (${globalTimer.get()}).`);

	//
};
