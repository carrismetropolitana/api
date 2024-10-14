/* * */

import NETWORKDB from '@/services/NETWORKDB.js';
import { SERVERDB } from '@api/services';
import 'dotenv/config';

import start from './start.js';

/* * */

const RUN_INTERVAL = 300000; // 5 minutes
const RUN_MODE = process.env.RUN_MODE || 'interval';

/* * */

(async function init() {
	//

	await SERVERDB.connect();
	await NETWORKDB.connect();

	//

	const runOnInterval = async () => {
		await start();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	//

	if (RUN_MODE === 'single') {
		await start();
		await new Promise(resolve => setTimeout(resolve, 1000)); // after 1 second
		process.exit(0); // End process
	}
	else {
		runOnInterval();
	}

	//
})();
