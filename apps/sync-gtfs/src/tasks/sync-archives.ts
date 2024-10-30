/* * */

import type { Archive } from '@carrismetropolitana/api-types/network';

import { NETWORKDB } from '@carrismetropolitana/api-services/NETWORKDB';
import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

export const syncArchives = async () => {
	//

	LOGGER.title(`Sync Archives`);
	const globalTimer = new TIMETRACKER();

	//
	// Fetch all Archives from NETWORKDB

	const allArchives = await NETWORKDB.client.query('SELECT * FROM archives');

	//
	// For each item, update its entry in the database

	const allArchivesData: Archive[] = [];
	let updatedArchivesCounter = 0;

	for (const archive of allArchives.rows) {
		//
		const parsedArchive: Archive = {
			agency_id: archive.operator_id,
			id: archive.archive_id,
			valid_range: {
				end: archive.archive_end_date,
				start: archive.archive_start_date,
			},
		};
		//
		allArchivesData.push(parsedArchive);
		//
		updatedArchivesCounter++;
		//
	}

	//
	// Save to the database

	allArchivesData.sort((a, b) => sortCollator.compare(a.valid_range.start, b.valid_range.start));
	await SERVERDB.set(SERVERDB_KEYS.NETWORK.ARCHIVES, JSON.stringify(allArchivesData));

	LOGGER.success(`Done updating ${updatedArchivesCounter} Archives (${globalTimer.get()})`);

	//
};
