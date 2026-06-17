/* * */

import { syncMetadata } from '@/tasks/sync-metadata.js';
import { syncRealtime } from '@/tasks/sync-realtime.js';
import LOGGER from '@helperkits/logger';
import 'dotenv/config';

/* * */

const RUN_INTERVAL = 60_000; // 1 minute

/* * */

(async function init() {
	//

	let counter = 0;

	const runOnInterval = async () => {
		//

		LOGGER.terminate(`Sync iteration #${counter}`);

		if (counter % 100 === 0) {
			// Run on every 100th iteration (~ 1 hour)
			await syncMetadata();
		}

		await syncRealtime();

		setTimeout(runOnInterval, RUN_INTERVAL);

		counter++;

		LOGGER.divider();

		//
	};

	await runOnInterval();

	//
})();
