/* * */

import SERVERDB from '@/services/SERVERDB.js';
import collator from '@/services/sortCollator.js';
import { convertEmissionClassCode, convertPropulsionCode, VehicleMetadata } from '@/types/vehicles.types.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/latest/vehicles/vehicles.csv';

const REDIS_BASE_KEY = 'v2:network:vehicles';

/* * */

export const syncMetadata = async () => {
	//

	LOGGER.divider();
	LOGGER.title(`SYNC METADATA`);

	const globalTimer = new TIMETRACKER();

	//
	// Download and parse the data file

	LOGGER.info(`Downloading data file...`);

	const downloadedCsvFile = await fetch(DATASET_FILE_URL);
	const downloadedCsvText = await downloadedCsvFile.text();
	const allItemsCsv = Papa.parse(downloadedCsvText, { header: true });

	//
	// For each item, update its entry in the database

	LOGGER.info(`Updating items...`);

	let updatedItemsCounter = 0;
	const allItemsData: VehicleMetadata[] = [];

	for (const itemCsv of allItemsCsv.data) {
		//
		const parsedItemData: VehicleMetadata = {
			agency_id: itemCsv.agency_id,
			bikes_allowed: itemCsv.bikes_allowed === '1',
			capacity_seated: itemCsv.capacity_seated ? parseInt(itemCsv.capacity_seated) : null,
			capacity_standing: itemCsv.capacity_standing ? parseInt(itemCsv.capacity_standing) : null,
			capacity_total: itemCsv.capacity_total ? parseInt(itemCsv.capacity_total) : null,
			emission_class: convertEmissionClassCode(itemCsv.emission_class),
			license_plate: itemCsv.license_plate,
			make: itemCsv.make,
			model: itemCsv.model,
			owner: itemCsv.owner,
			propulsion: convertPropulsionCode(itemCsv.propulsion),
			registration_date: itemCsv.registration_date,
			vehicle_id: itemCsv.vehicle_id,
			wheelchair_accessible: itemCsv.wheelchair_accessible === '1',
		};
		//
		allItemsData.push(parsedItemData);
		//
		updatedItemsCounter++;
		//
	}

	//
	// Save items to the database

	allItemsData.sort((a, b) => collator.compare(a.vehicle_id, b.vehicle_id));
	await SERVERDB.client.set(`${REDIS_BASE_KEY}:all`, JSON.stringify(allItemsData));

	LOGGER.success(`Done updating ${updatedItemsCounter} items (${globalTimer.get()}).`);

	//
};
