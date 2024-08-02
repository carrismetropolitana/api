/* * */

import SERVERDB from '@/services/SERVERDB.js';

import start from './start.js';

/* * */

const RUN_INTERVAL = 30000; // 30 seconds

/* * */

(async function init() {
	//

	await SERVERDB.connect();

	const runOnInterval = async () => {
		await start();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
