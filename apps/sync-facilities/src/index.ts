/* * */

import { syncBoatStations } from '@/tasks/sync-boat-stations.js';
import { syncLightRailStations } from '@/tasks/sync-light-rail-stations.js';
import { syncPip } from '@/tasks/sync-pip.js';
import { syncSchools } from '@/tasks/sync-schools.js';
import { syncSubwayStations } from '@/tasks/sync-subway-stations.js';
import { syncTrainStations } from '@/tasks/sync-train-stations.js';
import LOGGER from '@helperkits/logger';
import 'dotenv/config';

/* * */

const RUN_INTERVAL = 5000; // 5 seconds

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		//

		await syncSchools();

		await syncPip();

		await syncBoatStations();
		await syncLightRailStations();
		await syncSubwayStations();
		await syncTrainStations();

		//

		setTimeout(runOnInterval, RUN_INTERVAL);

		LOGGER.divider();

		//
	};

	await runOnInterval();

	//
})();
