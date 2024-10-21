/* * */

import { syncMetadata } from '@/tasks/sync-metadata.js';
import { syncRealtime } from '@/tasks/sync-realtime.js';
import LOGGER from '@helperkits/logger';
import 'dotenv/config';

/* * */

const RUN_INTERVAL = 5000; // 5 seconds

/* * */

(async function init() {
	//

	let counter = 0;

	const runOnInterval = async () => {
		//

		LOGGER.terminate(`Sync iteration #${counter}`);

		if (counter % 10 === 0) {
			// Run on every 100th iteration
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
