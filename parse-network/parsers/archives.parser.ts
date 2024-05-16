/* * */

import NETWORKDB from '../services/NETWORKDB';
import SERVERDB from '../services/SERVERDB';
import collator from '../modules/sortCollator';
import { getElapsedTime } from '../modules/timeCalc';

/* * */

export default async () => {
	//
	// 1.
	// Record the start time to later calculate operation duration
	const startTime = process.hrtime();

	// 2.
	// Fetch all Archives from Postgres
	console.log(`⤷ Querying database...`);
	const allArchives = await NETWORKDB.client.query('SELECT * FROM archives');

	// 3.
	// Initate a temporary variable to hold updated Archives
	const allArchivesData = [
	];
	const updatedArchiveKeys = new Set;

	// 4.
	// Log progress
	console.log(`⤷ Updating Archives...`);

	// 5.
	// For each archive, update its entry in the database
	for (const archive of allArchives.rows) {
		// Parse archive
		const parsedArchive = {
			id: archive.archive_id,
			operator_id: archive.operator_id,
			start_date: archive.archive_start_date,
			end_date: archive.archive_end_date,

		};
		// Update or create new document
		allArchivesData.push(parsedArchive);
		await SERVERDB.client.set(`archives:${parsedArchive.id}`, JSON.stringify(parsedArchive));
		updatedArchiveKeys.add(`archives:${parsedArchive.id}`);
	}

	// 6.
	// Log count of updated Archives
	console.log(`⤷ Updated ${updatedArchiveKeys.size} Archives.`);

	// 7.
	// Add the 'all' option
	allArchivesData.sort((a, b) => collator.compare(a.start_date, b.start_date));
	await SERVERDB.client.set('archives:all', JSON.stringify(allArchivesData));
	updatedArchiveKeys.add('archives:all');

	// 8.
	// Delete all Archives not present in the current update
	const allSavedArchiveKeys = [
	];
	for await (const key of SERVERDB.client.scanIterator({ TYPE: 'string', MATCH: 'archives:*' })) { allSavedArchiveKeys.push(key); }

	const staleArchiveKeys = allSavedArchiveKeys.filter((item) => !updatedArchiveKeys.has(item));
	if (staleArchiveKeys.length) { await SERVERDB.client.del(staleArchiveKeys); }
	console.log(`⤷ Deleted ${staleArchiveKeys.length} stale Archives.`);

	// 9.
	// Log elapsed time in the current operation
	const elapsedTime = getElapsedTime(startTime);
	console.log(`⤷ Done updating Archives (${elapsedTime}).`);

	//
};