/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';

import start from './start.js';

/* * */

const RUN_INTERVAL = 15000; // 15 seconds

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
