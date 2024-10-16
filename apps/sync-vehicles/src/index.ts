/* * */

import { syncMetadata } from '@/tasks/sync-metadata.js';
import { syncPositions } from '@/tasks/sync-positions.js';
import { PCGIDB, SERVERDB } from '@carrismetropolitana/api-services';
import LOGGER from '@helperkits/logger';
import 'dotenv/config';

/* * */

(async function init() {
	//

	LOGGER.init();

	await PCGIDB.connect();
	await SERVERDB.connect();

	//

	const SYNC_METADATA_INTERVAL = 5000;

	const syncMetadataOnInterval = async () => {
		await syncMetadata();
		setTimeout(syncMetadataOnInterval, SYNC_METADATA_INTERVAL);
	};

	await syncMetadataOnInterval();

	//

	const SYNC_POSITIONS_INTERVAL = 5000; // 5 seconds

	const syncPositionsOnInterval = async () => {
		await syncPositions();
		setTimeout(syncPositionsOnInterval, SYNC_POSITIONS_INTERVAL);
	};

	await syncPositionsOnInterval();

	//
})();
