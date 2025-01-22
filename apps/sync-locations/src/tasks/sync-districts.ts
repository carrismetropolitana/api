/* * */

import type { District } from '@carrismetropolitana/api-types/locations';

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { normalizeDirectoryPermissions, sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import extract from 'extract-zip';
import fs from 'fs';

/* * */

const DATASET_FILE_URL = 'https://github.com/carrismetropolitana/datasets/raw/refs/heads/latest/locations/districts.zip';

/* * */

interface DistrictsSource extends GeoJSON.FeatureCollection {
	features: {
		geometry: GeoJSON.Geometry
		id: string
		properties: {
			area_ha: string
			id: string
			name: string
		}
		type: 'Feature'
	}[]
	type: 'FeatureCollection'
}

/* * */

export const syncDistricts = async () => {
	//

	LOGGER.title(`Sync Districts`);
	const globalTimer = new TIMETRACKER();

	//
	// Download and parse the data file

	LOGGER.info(`Downloading data file...`);

	const rawDirPath = '/tmp/districts';
	const rawDirFile = `${rawDirPath}/raw.zip`;

	const downloadedSourceResponse = await fetch(DATASET_FILE_URL);
	const downloadedSourceArrayBuffer = await downloadedSourceResponse.arrayBuffer();

	fs.rmSync(rawDirPath, { force: true, recursive: true });
	fs.mkdirSync(rawDirPath, { recursive: true });
	fs.writeFileSync(rawDirFile, Buffer.from(downloadedSourceArrayBuffer));

	await extract(rawDirFile, { dir: rawDirPath });
	normalizeDirectoryPermissions(rawDirPath);

	const downloadedSourceText = fs.readFileSync(`${rawDirPath}/districts.json`, 'utf8');
	const downloadedSourceJson: DistrictsSource = JSON.parse(downloadedSourceText);

	//
	// For each item, update its entry in the database

	LOGGER.info(`Updating items...`);

	const allUpdatedItemsData: District[] = [];

	for (const sourceItem of downloadedSourceJson.features) {
		//

		const updatedItemData: District = {
			id: sourceItem.properties.id,
			name: sourceItem.properties.name,
		};

		allUpdatedItemsData.push(updatedItemData);

		//
	}

	//
	// Save items to the database

	allUpdatedItemsData.sort((a, b) => sortCollator.compare(a.id, b.id));
	await SERVERDB.set(SERVERDB_KEYS.LOCATIONS.DISTRICTS, JSON.stringify(allUpdatedItemsData));

	LOGGER.success(`Done updating ${allUpdatedItemsData.length} items to ${SERVERDB_KEYS.LOCATIONS.DISTRICTS} (${globalTimer.get()}).`);

	//
};
