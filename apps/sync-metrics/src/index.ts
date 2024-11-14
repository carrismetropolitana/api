/* * */

import { TRINODB } from '@carrismetropolitana/api-services/TRINODB';
import LOGGER from '@helperkits/logger';
import 'dotenv/config';

/* * */

import { syncDemandMetricsByDay } from '@/tasks/sync-demand-metrics-by-day.js';
import { syncDemandMetricsByLine } from '@/tasks/sync-demand-metrics-by-line.js';
import { syncServiceMetrics } from '@/tasks/sync-service-metrics.js';
// import { syncDemandMetricsByStop } from '@/tasks/sync-demand-metrics-by-stop.js';

/* * */

const RUN_INTERVAL = 300000; // 5 minutes

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
		await syncDemandMetricsByDay();
		await syncDemandMetricsByLine();
		// await syncDemandMetricsByStop();

		setTimeout(runOnInterval, RUN_INTERVAL);

		counter++;

		LOGGER.divider();

		//
	};

	await runOnInterval();

	//
})();
