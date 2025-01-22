/* * */

import type { Locality } from '@carrismetropolitana/api-types/locations';
import type { GeoJSON } from 'geojson';

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { normalizeDirectoryPermissions, sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import extract from 'extract-zip';
import fs from 'fs';

/* * */

const DATASET_FILE_URL = 'https://github.com/carrismetropolitana/datasets/raw/refs/heads/latest/locations/localities.zip';

/* * */

interface LocalitiesSource extends GeoJSON.FeatureCollection {
	features: {
		geometry: GeoJSON.Geometry
		id: string
		properties: {
			district_id: string
			id: string
			municipality_id: string
			name: string
			parish_id: string
		}
		type: 'Feature'
	}[]
	type: 'FeatureCollection'
}

/* * */

export const syncLocalities = async () => {
	//

	LOGGER.title(`Sync Localities`);
	const globalTimer = new TIMETRACKER();

	//
	// Download and parse the data file

	LOGGER.info(`Downloading data file...`);

	const rawDirPath = '/tmp/localities';
	const rawDirFile = `${rawDirPath}/raw.zip`;

	const downloadedSourceResponse = await fetch(DATASET_FILE_URL);
	const downloadedSourceArrayBuffer = await downloadedSourceResponse.arrayBuffer();

	fs.rmSync(rawDirPath, { force: true, recursive: true });
	fs.mkdirSync(rawDirPath, { recursive: true });
	fs.writeFileSync(rawDirFile, Buffer.from(downloadedSourceArrayBuffer));

	await extract(rawDirFile, { dir: rawDirPath });
	normalizeDirectoryPermissions(rawDirPath);

	const downloadedSourceText = fs.readFileSync(`${rawDirPath}/localities.json`, 'utf8');
	const downloadedSourceJson: LocalitiesSource = JSON.parse(downloadedSourceText);

	//
	// For each item, update its entry in the database

	LOGGER.info(`Updating items...`);

	const allUpdatedItemsData: Locality[] = [];

	for (const sourceItem of downloadedSourceJson.features) {
		//

		const updatedItemData: Locality = {
			display: '',
			district_id: sourceItem.properties.district_id,
			id: sourceItem.properties.id,
			municipality_id: sourceItem.properties.municipality_id,
			name: sourceItem.properties.name,
			parish_id: sourceItem.properties.parish_id,
		};

		allUpdatedItemsData.push(updatedItemData);

		//
	}

	//
	// Save items to the database

	allUpdatedItemsData.sort((a, b) => sortCollator.compare(a.id, b.id));
	await SERVERDB.set(SERVERDB_KEYS.LOCATIONS.LOCALITIES, JSON.stringify(allUpdatedItemsData));

	LOGGER.success(`Done updating ${allUpdatedItemsData.length} items to ${SERVERDB_KEYS.LOCATIONS.LOCALITIES} (${globalTimer.get()}).`);

	//
};
