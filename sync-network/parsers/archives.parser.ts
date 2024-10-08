/* * */

import collator from '@/modules/sortCollator.js';
import NETWORKDB from '@/services/NETWORKDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

export default async () => {
	//

	const globalTimer = new TIMETRACKER();

	//
	// Fetch all Archives from NETWORKDB

	LOGGER.info(`Starting...`);
	const allArchives = await NETWORKDB.client.query('SELECT * FROM archives');

	//
	// Initate a temporary variable to hold updated items

	const allArchivesData = [];
	const updatedArchiveKeys = new Set();

	//
	// For each item, update its entry in the database

	for (const archive of allArchives.rows) {
		// Parse archive
		const parsedArchive = {
			end_date: archive.archive_end_date,
			id: archive.archive_id,
			operator_id: archive.operator_id,
			start_date: archive.archive_start_date,

		};
		// Update or create new document
		allArchivesData.push(parsedArchive);
		await SERVERDB.client.set(`v2/network/archives/${parsedArchive.id}`, JSON.stringify(parsedArchive));
		updatedArchiveKeys.add(`v2/network/archives/${parsedArchive.id}`);
	}

	LOGGER.info(`Updated ${updatedArchiveKeys.size} Archives`);

	//
	// Add the 'all' option

	allArchivesData.sort((a, b) => collator.compare(a.start_date, b.start_date));
	await SERVERDB.client.set('v2/network/archives/all', JSON.stringify(allArchivesData));
	updatedArchiveKeys.add('v2/network/archives/all');

	//
	// Delete all items not present in the current update

	const allSavedArchiveKeys = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'v2/network/archives/*', TYPE: 'string' })) {
		allSavedArchiveKeys.push(key);
	}

	const staleArchiveKeys = allSavedArchiveKeys.filter(item => !updatedArchiveKeys.has(item));
	if (staleArchiveKeys.length) {
		await SERVERDB.client.del(staleArchiveKeys);
	}

	LOGGER.info(`Deleted ${staleArchiveKeys.length} stale Archives`);

	//

	LOGGER.success(`Done updating Archives (${globalTimer.get()})`);

	//
};
