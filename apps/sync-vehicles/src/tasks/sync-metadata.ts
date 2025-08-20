/* * */

import type { VehicleMetadataSource } from '@/types/sources.js';

import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { convertGTFSBoolToBoolean } from '@carrismetropolitana/api-types/gtfs-extended';
import { convertVehicleEmissionClassCode, convertVehiclePropulsionCode, Vehicle } from '@carrismetropolitana/api-types/vehicles';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { DateTime } from 'luxon';
import Papa from 'papaparse';

/* * */

const DATASET_FILE_URL = 'https://raw.githubusercontent.com/carrismetropolitana/datasets/refs/heads/latest/vehicles/vehicles.csv';

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
	const allItemsCsv = Papa.parse<VehicleMetadataSource>(downloadedCsvText, { header: true });

	LOGGER.info(`Downloading existing vehicles...`);

	const existingVehiclesTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.VEHICLES.ALL) as string;
	const existingVehiclesData: Vehicle[] = JSON.parse(existingVehiclesTxt);

	const allVehiclesMap = new Map<string, Vehicle>();
	existingVehiclesData?.forEach(vehicle => allVehiclesMap.set(vehicle.id, vehicle));

	//
	// For each item, update its entry in the database

	LOGGER.info(`Updating items...`);

	let updatedItemsCounter = 0;
	const allItemsData: Vehicle[] = [];

	for (const itemCsv of allItemsCsv.data) {
		//
		const existingItemData = allVehiclesMap.get(`${itemCsv.agency_id}|${itemCsv.vehicle_id}`);
		//
		const parsedItemMetadata: Vehicle = {
			agency_id: itemCsv.agency_id,
			bikes_allowed: convertGTFSBoolToBoolean(itemCsv.bikes_allowed),
			capacity_seated: Number(itemCsv.capacity_seated),
			capacity_standing: Number(itemCsv.capacity_standing),
			capacity_total: Number(itemCsv.capacity_seated) + Number(itemCsv.capacity_standing),
			contactless: itemCsv.contactless === '1',
			emission_class: convertVehicleEmissionClassCode(itemCsv.emission_class),
			id: `${itemCsv.agency_id}|${itemCsv.vehicle_id}`,
			license_plate: itemCsv.license_plate?.replace(/^(\w{2})(\w{2})(\w{2})$/, '$1-$2-$3'),
			make: itemCsv.make,
			model: itemCsv.model,
			owner: itemCsv.owner,
			propulsion: convertVehiclePropulsionCode(itemCsv.propulsion),
			registration_date: itemCsv.registration_date,
			wheelchair_accessible: convertGTFSBoolToBoolean(itemCsv.wheelchair_accessible),
		};
		//
		const parsedItemData = existingItemData?.timestamp ?? 0 > DateTime.now().minus({ seconds: 90 }).toUnixInteger() ? { ...existingItemData, ...parsedItemMetadata } : parsedItemMetadata;
		//
		allItemsData.push(parsedItemData);
		//
		updatedItemsCounter++;
		//
	}

	//
	// Save items to the database

	allItemsData.sort((a, b) => sortCollator.compare(a.id, b.id));
	await SERVERDB.set(SERVERDB_KEYS.NETWORK.VEHICLES.ALL, JSON.stringify(allItemsData));

	LOGGER.success(`Done updating ${updatedItemsCounter} items to ${SERVERDB_KEYS.NETWORK.VEHICLES.ALL} (${globalTimer.get()}).`);

	//
};
