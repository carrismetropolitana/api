/* * */

import { TRINODB } from '@carrismetropolitana/api-services/TRINODB';
import LOGGER from '@helperkits/logger';
import 'dotenv/config';

/* * */

import { syncDemandMetricsByAgencyDay } from '@/tasks/sync-demand-metrics-by-agency-day.js';
import { syncDemandMetricsByAgencyMonth } from '@/tasks/sync-demand-metrics-by-agency-month.js';
import { syncDemandMetricsByAgencyYear } from '@/tasks/sync-demand-metrics-by-agency-year.js';
import { syncDemandMetricsByLine } from '@/tasks/sync-demand-metrics-by-line.js';
// import { syncDemandMetricsByStop } from '@/tasks/sync-demand-metrics-by-stop.js';
import { syncServiceMetrics } from '@/tasks/sync-service-metrics.js';

/* * */

const RUN_INTERVAL = 300000; // 5 minutes

/* * */

(async function init() {
	//

	await TRINODB.connect();

	// return;

	//

	let counter = 0;

	const runOnInterval = async () => {
		//

		LOGGER.terminate(`Sync iteration #${counter}`);

		// Run on all iterations
		await syncDemandMetricsByLine();
		// await syncDemandMetricsByStop();
		await syncDemandMetricsByAgencyDay();

		// Run on every 100th iteration
		if (counter % 100 === 0) {
			await syncServiceMetrics();
			await syncDemandMetricsByAgencyMonth();
		}

		// Run on every 500th iteration
		if (counter % 500 === 0) {
			await syncDemandMetricsByAgencyYear();
		}

		setTimeout(runOnInterval, RUN_INTERVAL);

		counter++;

		LOGGER.divider();

		//
	};

	await runOnInterval();

	//
})();
