/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { School, SchoolsSource } from '@carrismetropolitana/api-types/api';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/latest/facilities/schools/schools.csv';

/* * */

export const syncSchools = async () => {
	//

	LOGGER.title(`Sync Train Stations`);
	const globalTimer = new TIMETRACKER();

	//
	// Download and parse the data file

	LOGGER.info(`Downloading data file...`);

	const downloadedSourceFile = await fetch(DATASET_FILE_URL);
	const downloadedSourceText = await downloadedSourceFile.text();
	const allSourceItems = Papa.parse<SchoolsSource>(downloadedSourceText, { header: true });

	//
	// For each item, update its entry in the database

	LOGGER.info(`Updating items...`);

	let updatedItemsCounter = 0;
	const allUpdatedItemsData: School[] = [];

	for (const sourceItem of allSourceItems.data) {
		//

		const updatedItemData: School = {
			address: sourceItem.address,
			cicles: sourceItem.cicles,
			district_id: sourceItem.district_id,
			district_name: sourceItem.district_name,
			email: sourceItem.email,
			grouping: sourceItem.grouping,
			id: sourceItem.id,
			lat: Number(sourceItem.lat),
			locality: sourceItem.locality,
			lon: Number(sourceItem.lon),
			municipality_id: sourceItem.municipality_id,
			municipality_name: sourceItem.municipality_name,
			name: sourceItem.name,
			nature: sourceItem.nature,
			parish_id: sourceItem.parish_id,
			parish_name: sourceItem.parish_name,
			phone: sourceItem.phone,
			region_id: sourceItem.region_id,
			region_name: sourceItem.region_name,
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
	await SERVERDB.set(SERVERDB_KEYS.FACILITIES.SCHOOLS, JSON.stringify(allUpdatedItemsData));

	LOGGER.success(`Done updating ${updatedItemsCounter} items to ${SERVERDB_KEYS.FACILITIES.SCHOOLS} (${globalTimer.get()}).`);

	//
};
