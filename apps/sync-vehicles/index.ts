/* * */

import { PCGIDB, SERVERDB } from '@api/services';

import start from './start.js';

/* * */

const RUN_INTERVAL = 5000; // 5 seconds

/* * */

(async function init() {
	//

	await PCGIDB.connect();
	await SERVERDB.connect();

	const runOnInterval = async () => {
		await start();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
