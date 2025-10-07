/* * */

import { alertMetrics } from '@/tasks/alert-metrics.js';
import { alertsByMunicipality } from '@/tasks/alerts-by-municipality.js';
import { alertsCauseEffect } from '@/tasks/alerts-cause-effect.js';
import { alertsEvolution } from '@/tasks/alerts-evolution.js';
import { alertsSummary } from '@/tasks/alerts-summary.js';

/* * */

//
// Run once every 24 hours

const RUN_INTERVAL = 86_400_000;

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		await alertMetrics();
		await alertsCauseEffect();
		await alertsByMunicipality();
		await alertsEvolution();
		await alertsSummary();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
