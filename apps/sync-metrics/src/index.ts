/* * */

import LOGGER from '@helperkits/logger';
import 'dotenv/config';

/* * */

import { complaintsMetrics } from '@/tasks/complaints-metrics.js';
import { demandMetrics } from '@/tasks/demand-metrics.js';
import { serviceMetrics } from '@/tasks/service-metrics.js';
import { videowallDelays } from '@/tasks/videowall-delays.js';
import { videowallEmptyRides } from '@/tasks/videowall-empty-rides.js';
import { videowallSla } from '@/tasks/videowall-sla.js';
import { videowallValidations } from '@/tasks/videowall-validations.js';
import { videowallVkm } from '@/tasks/videowall-vkm.js';

/* * */

const RUN_INTERVAL = 60000; // 1 minute

/* * */

(async function init() {
	//

	let counter = 0;

	const runOnInterval = async () => {
		//

		LOGGER.terminate(`Sync iteration #${counter}`);

		//
		// Run on all iterations
		await complaintsMetrics();
		await videowallDelays();
		await videowallEmptyRides();
		await videowallSla();
		await videowallValidations();
		await videowallVkm();
		await demandMetrics();

		//
		// Run on every 500th iteration (~ 8 hours)

		if (counter % 100 === 0) {
			await serviceMetrics();
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
