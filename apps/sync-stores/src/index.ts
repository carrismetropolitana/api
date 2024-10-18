/* * */

import { syncMetadata } from '@/tasks/sync-metadata.js';
import { syncTickets } from '@/tasks/sync-tickets.js';
import { PCGIDB } from '@carrismetropolitana/api-services';
import LOGGER from '@helperkits/logger';
import 'dotenv/config';

/* * */

const RUN_INTERVAL = 5000; // 5 seconds

/* * */

(async function init() {
	//

	await PCGIDB.connect();

	//

	let counter = 0;

	const runOnInterval = async () => {
		//

		LOGGER.terminate(`Sync iteration #${counter}`);

		if (counter % 10 === 0) {
			// Run on every 10th iteration
			await syncMetadata();
		}

		await syncTickets();

		setTimeout(runOnInterval, RUN_INTERVAL);

		counter++;

		LOGGER.divider();

		//
	};

	await runOnInterval();

	//
})();
