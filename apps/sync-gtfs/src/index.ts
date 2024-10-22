/* * */

import { NETWORKDB } from '@carrismetropolitana/api-services/NETWORKDB';
import 'dotenv/config';

import start from './start.js';

/* * */

const RUN_INTERVAL = 300000; // 5 minutes

/* * */

(async function init() {
	//

	await NETWORKDB.connect();

	//

	const runOnInterval = async () => {
		await start();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
