/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { Facility, FacilitySource } from '@carrismetropolitana/api-types/facilities';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/latest/facilities/pips/pips.csv';

/* * */

export const syncPips = async () => {
	//

	LOGGER.title(`Sync PIPs`);
	const globalTimer = new TIMETRACKER();

	//
	// Download and parse the data file

	LOGGER.info(`Downloading data file...`);

	const downloadedSourceFile = await fetch(DATASET_FILE_URL);
	const downloadedSourceText = await downloadedSourceFile.text();
	const allSourceItems = Papa.parse<FacilitySource>(downloadedSourceText, { header: true });

	//
	// For each item, update its entry in the database

	LOGGER.info(`Updating items...`);

	let updatedItemsCounter = 0;
	const allUpdatedItemsData: Facility[] = [];

	for (const sourceItem of allSourceItems.data) {
		//

		const updatedItemData: Facility = {
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
			stop_ids: sourceItem.stops?.length ? sourceItem.stops.split('|') : [],
		};

		allUpdatedItemsData.push(updatedItemData);

		updatedItemsCounter++;

		//
	}

	//
	// Save items to the database

	allUpdatedItemsData.sort((a, b) => sortCollator.compare(a.id, b.id));
	await SERVERDB.set(SERVERDB_KEYS.FACILITIES.PIPS, JSON.stringify(allUpdatedItemsData));

	LOGGER.success(`Done updating ${updatedItemsCounter} items to ${SERVERDB_KEYS.FACILITIES.PIPS} (${globalTimer.get()}).`);

	//
};
