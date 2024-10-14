/* * */

import PCGIDB from '@/services/PCGIDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import { syncMetadata } from '@/tasks/sync-metadata.js';
import { syncPositions } from '@/tasks/sync-positions.js';
import LOGGER from '@helperkits/logger';
import dotenv from 'dotenv';

/* * */

(async function init() {
	//

	dotenv.config({ path: '../.env.local' });

	LOGGER.init();

	await PCGIDB.connect();
	await SERVERDB.connect();

	//

	const SYNC_METADATA_INTERVAL = 60000;

	const syncMetadataOnInterval = async () => {
		await syncMetadata();
		setTimeout(syncMetadataOnInterval, SYNC_METADATA_INTERVAL);
	};

	syncMetadataOnInterval();

	//

	const SYNC_POSITIONS_INTERVAL = 5000; // 5 seconds

	const syncPositionsOnInterval = async () => {
		await syncPositions();
		setTimeout(syncPositionsOnInterval, SYNC_POSITIONS_INTERVAL);
	};

	// syncPositionsOnInterval();

	//
})();
