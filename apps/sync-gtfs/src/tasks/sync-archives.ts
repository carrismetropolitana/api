/* * */

import collator from '@/modules/sortCollator.js';
import { NETWORKDB, SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
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

	const allArchivesData = [];
	let updatedArchivesCounter = 0;

	for (const archive of allArchives.rows) {
		//
		const parsedArchive = {
			end_date: archive.archive_end_date,
			id: archive.archive_id,
			operator_id: archive.operator_id,
			start_date: archive.archive_start_date,

		};
		//
		allArchivesData.push(parsedArchive);
		//
		updatedArchivesCounter++;
		//
	}

	//
	// Save to the database

	allArchivesData.sort((a, b) => collator.compare(a.start_date, b.start_date));
	await SERVERDB.set(SERVERDB_KEYS.NETWORK.ARCHIVES, JSON.stringify(allArchivesData));

	LOGGER.success(`Done updating ${updatedArchivesCounter} Archives (${globalTimer.get()})`);

	//
};
