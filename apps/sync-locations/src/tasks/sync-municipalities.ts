/* * */

import type { Municipality } from '@carrismetropolitana/api-types/locations';

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { normalizeDirectoryPermissions, sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import extract from 'extract-zip';
import fs from 'fs';

/* * */

const DATASET_FILE_URL = 'https://github.com/carrismetropolitana/datasets/raw/refs/heads/latest/locations/municipalities.zip';

/* * */

export const syncMunicipalities = async () => {
	//

	LOGGER.title(`Sync Municipalities`);
	const globalTimer = new TIMETRACKER();

	//
	// Download and parse the data file

	LOGGER.info(`Downloading data file...`);

	const rawDirPath = '/tmp/municipalities';
	const rawDirFile = `${rawDirPath}/raw.zip`;

	const downloadedSourceResponse = await fetch(DATASET_FILE_URL);
	const downloadedSourceArrayBuffer = await downloadedSourceResponse.arrayBuffer();

	fs.rmSync(rawDirPath, { force: true, recursive: true });
	fs.mkdirSync(rawDirPath, { recursive: true });
	fs.writeFileSync(rawDirFile, Buffer.from(downloadedSourceArrayBuffer));

	await extract(rawDirFile, { dir: rawDirPath });
	normalizeDirectoryPermissions(rawDirPath);

	const downloadedSourceText = fs.readFileSync(`${rawDirPath}/municipalities.json`, 'utf8');
	const downloadedSourceJson = JSON.parse(downloadedSourceText);

	//
	// For each item, update its entry in the database

	LOGGER.info(`Updating items...`);

	const allUpdatedItemsData: Municipality[] = [];

	for (const sourceItem of downloadedSourceJson.features) {
		//

		const updatedItemData: Municipality = {
			district_id: sourceItem.id.substring(0, 2),
			id: sourceItem.id,
			name: sourceItem.properties.name,
		};

		allUpdatedItemsData.push(updatedItemData);

		//
	}

	//
	// Save items to the database

	allUpdatedItemsData.sort((a, b) => sortCollator.compare(a.id, b.id));
	await SERVERDB.set(SERVERDB_KEYS.LOCATIONS.MUNICIPALITIES, JSON.stringify(allUpdatedItemsData));

	LOGGER.success(`Done updating ${allUpdatedItemsData.length} items to ${SERVERDB_KEYS.LOCATIONS.MUNICIPALITIES} (${globalTimer.get()}).`);

	//
};
