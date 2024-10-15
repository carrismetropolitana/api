/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';

import start from './start.js';

/* * */

const RUN_INTERVAL = 1200000; // 20 minutes

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
