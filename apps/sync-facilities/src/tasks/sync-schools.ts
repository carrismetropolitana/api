/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type School, type SchoolsSource } from '@carrismetropolitana/api-types/facilities';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/latest/facilities/schools/schools.csv';

/* * */

export const syncSchools = async () => {
	//

	LOGGER.title(`Sync Schools`);
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

		const parsedCicles: string[] = [];

		if (sourceItem.pre_school === '1') parsedCicles.push('pre_school');
		if (sourceItem.basic_1 === '1') parsedCicles.push('basic_1');
		if (sourceItem.basic_2 === '1') parsedCicles.push('basic_2');
		if (sourceItem.basic_3 === '1') parsedCicles.push('basic_3');
		if (sourceItem.high_school === '1') parsedCicles.push('high_school');
		if (sourceItem.professional === '1') parsedCicles.push('professional');
		if (sourceItem.special === '1') parsedCicles.push('special');
		if (sourceItem.artistic === '1') parsedCicles.push('artistic');
		if (sourceItem.university === '1') parsedCicles.push('university');
		if (sourceItem.other === '1') parsedCicles.push('other');

		const updatedItemData: School = {

			//
			// Metadata

			cicles: parsedCicles,
			district_id: sourceItem.district_id,
			district_name: sourceItem.district_name,
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
			region_id: sourceItem.region_id,
			region_name: sourceItem.region_name,
			stop_ids: sourceItem.stops?.length ? sourceItem.stops.split('|') : [],

			//
			// Contacts

			contacts: {
				address: sourceItem.address,
				email: sourceItem.email,
				google_place_id: null,
				phone: sourceItem.phone,
				postal_code: sourceItem.postal_code,
				url: sourceItem.url,
			},

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
