/* * */

import 'dotenv/config';
import LOGGER from '@helperkits/logger';

/* * */

import { syncDistricts } from '@/tasks/sync-districts.js';
import { syncMunicipalities } from '@/tasks/sync-municipalities.js';
import { syncParishes } from '@/tasks/sync-parishes.js';
// import { syncLocalities } from '@/tasks/sync-districts.js';

/* * */

const RUN_INTERVAL = 3600000; // 1 hour

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		//

		await syncDistricts();
		await syncMunicipalities();
		await syncParishes();
		// await syncLocalities();

		setTimeout(runOnInterval, RUN_INTERVAL);

		LOGGER.divider();

		//
	};

	runOnInterval();

	//
})();
