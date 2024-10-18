/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings/src/constants.js';
import { convertEmissionClassCode, convertPropulsionCode, VehicleMetadata } from '@carrismetropolitana/api-types/src/api';
import { convertGTFSBoolToBoolean, VehiclesExtended } from '@carrismetropolitana/api-types/src/gtfs';
import { sortCollator } from '@carrismetropolitana/api-utils/src/sortCollator.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import Papa from 'papaparse';

/* * */

// const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/latest/vehicles/vehicles.csv';
const DATASET_FILE_URL = 'https://storage.carrismetropolitana.pt/static/test/vehicles.csv';

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
	const allItemsCsv = Papa.parse<VehiclesExtended>(downloadedCsvText, { header: true });

	//
	// For each item, update its entry in the database

	LOGGER.info(`Updating items...`);

	let updatedItemsCounter = 0;
	const allItemsData: VehicleMetadata[] = [];

	for (const itemCsv of allItemsCsv.data) {
		//
		const parsedItemData: VehicleMetadata = {
			agency_id: itemCsv.agency_id,
			bikes_allowed: convertGTFSBoolToBoolean(itemCsv.bikes_allowed),
			capacity_seated: Number(itemCsv.capacity_seated),
			capacity_standing: Number(itemCsv.capacity_standing),
			capacity_total: Number(itemCsv.capacity_seated) + Number(itemCsv.capacity_standing),
			emission_class: convertEmissionClassCode(itemCsv.emission_class),
			license_plate: itemCsv.license_plate,
			make: itemCsv.make,
			model: itemCsv.model,
			owner: itemCsv.owner,
			propulsion: convertPropulsionCode(itemCsv.propulsion),
			registration_date: itemCsv.registration_date,
			vehicle_id: `${itemCsv.agency_id}|${itemCsv.vehicle_id}`,
			wheelchair_accessible: convertGTFSBoolToBoolean(itemCsv.wheelchair_accessible),
		};
		//
		allItemsData.push(parsedItemData);
		//
		updatedItemsCounter++;
		//
	}

	//
	// Save items to the database

	allItemsData.sort((a, b) => sortCollator.compare(a.vehicle_id, b.vehicle_id));
	await SERVERDB.set(SERVERDB_KEYS.NETWORK.VEHICLES.ALL, JSON.stringify(allItemsData));

	LOGGER.success(`Done updating ${updatedItemsCounter} items to ${SERVERDB_KEYS.NETWORK.VEHICLES.ALL} (${globalTimer.get()}).`);

	//
};
