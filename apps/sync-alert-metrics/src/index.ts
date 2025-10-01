/* * */

import { alertMetrics } from './tasks/alert-metrics.js';

/* * */

const RUN_INTERVAL = 600_000; // 10 minutes

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		await alertMetrics();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
