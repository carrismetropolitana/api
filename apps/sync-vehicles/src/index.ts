/* * */

import { syncMetadata } from '@/tasks/sync-metadata.js';
import { syncPositions } from '@/tasks/sync-positions.js';
import { PCGIDB, SERVERDB } from '@carrismetropolitana/api-services';
import LOGGER from '@helperkits/logger';
import 'dotenv/config';

/* * */

(async function init() {
	//

	await PCGIDB.connect();
	await SERVERDB.connect();

	//

	const SYNC_POSITIONS_INTERVAL = 5000; // 5 seconds

	let counter = 0;

	const runOnInterval = async () => {
		//

		LOGGER.terminate(`Sync iteration #${counter}`);

		if (counter % 10 === 0) {
			// Run on every 10th iteration
			await syncMetadata();
		}

		await syncPositions();

		setTimeout(runOnInterval, SYNC_POSITIONS_INTERVAL);

		counter++;

		LOGGER.divider();

		//
	};

	await runOnInterval();

	//
})();
