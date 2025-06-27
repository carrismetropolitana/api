/* * */

import { TRINODB } from '@carrismetropolitana/api-services/TRINODB';
import LOGGER from '@helperkits/logger';
import 'dotenv/config';

/* * */

import { complaintsMetrics } from '@/tasks/complaints-metrics.js';
import { demandMetricsByAgencyDay } from '@/tasks/demand-metrics-by-agency-day.js';
import { demandMetricsByAgencyMonth } from '@/tasks/demand-metrics-by-agency-month.js';
import { demandMetricsByAgencyYear } from '@/tasks/demand-metrics-by-agency-year.js';
import { demandMetricsByLine } from '@/tasks/demand-metrics-by-line.js';
import { serviceMetrics } from '@/tasks/service-metrics.js';
// import { videowallDelays } from '@/tasks/videowall-delays.js';
// import { videowallEmptyRides } from '@/tasks/videowall-empty-rides.js';
// import { videowallSla } from '@/tasks/videowall-sla.js';
import { videowallValidations } from '@/tasks/videowall-validations.js';
// import { videowallVkm } from '@/tasks/videowall-vkm.js';

/* * */

const RUN_INTERVAL = 60000; // 1 minute

/* * */

(async function init() {
	//

	await TRINODB.connect();

	//

	let counter = 0;

	const runOnInterval = async () => {
		//

		LOGGER.terminate(`Sync iteration #${counter}`);

		//
		// Run on all iterations
		await complaintsMetrics();
		// await videowallDelays();
		// await videowallEmptyRides();
		// await videowallSla();
		await videowallValidations();
		// await videowallVkm();

		//
		// Run on every 5th iteration (~ 5 minutes)

		if (counter % 5 === 0) {
			await demandMetricsByAgencyDay();
			await demandMetricsByLine();
		}

		//
		// Run on every 500th iteration (~ 8 hours)

		if (counter % 100 === 0) {
			await demandMetricsByAgencyMonth();
			await serviceMetrics();
		}

		//
		// Run on every 1000th iteration (~ 16 hours)

		if (counter % 1000 === 0) {
			await demandMetricsByAgencyYear();
		}

		//

		setTimeout(runOnInterval, RUN_INTERVAL);

		counter++;

		LOGGER.divider();

		//
	};

	await runOnInterval();

	//
})();
