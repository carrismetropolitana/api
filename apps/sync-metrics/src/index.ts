/* * */

import { syncServiceMetrics } from '@/tasks/sync-service-metrics.js';
import { TRINODB } from '@carrismetropolitana/api-services/TRINODB';
import LOGGER from '@helperkits/logger';
import 'dotenv/config';

/* * */

const RUN_INTERVAL = 3000; // 3 seconds

/* * */

(async function init() {
	//

	await TRINODB.connect();

	//

	let counter = 0;

	const runOnInterval = async () => {
		//

		LOGGER.terminate(`Sync iteration #${counter}`);

		// Run on every 500th iteration
		if (counter % 500 === 0) {
			// await syncYearValidations();
		}

		// Run on every 100th iteration
		if (counter % 100 === 0) {
			await syncServiceMetrics();
		}

		// Run on all iterations
		// await syncTodayValidations();

		setTimeout(runOnInterval, RUN_INTERVAL);

		counter++;

		LOGGER.divider();

		//
	};

	await runOnInterval();

	//
})();
