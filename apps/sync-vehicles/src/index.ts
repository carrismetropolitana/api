/* * */

// import { syncMetadata } from '@/tasks/sync-metadata.js';
import { syncPositions } from '@/tasks/sync-positions.js';
import { PCGIDB } from '@carrismetropolitana/api-services';
import LOGGER from '@helperkits/logger';
import 'dotenv/config';

/* * */

const RUN_INTERVAL = 3000; // 3 seconds

/* * */

(async function init() {
	//

	await PCGIDB.connect();

	//

	let counter = 0;

	const runOnInterval = async () => {
		//

		LOGGER.terminate(`Sync iteration #${counter}`);

		// if (counter % 100 === 0) {
		// 	// Run on every 100th iteration
		// 	await syncMetadata();
		// }

		await syncPositions();

		setTimeout(runOnInterval, RUN_INTERVAL);

		counter++;

		LOGGER.divider();

		//
	};

	await runOnInterval();

	//
})();
