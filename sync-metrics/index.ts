/* * */

import PCGIDB from '@/services/PCGIDB.js';
import SERVERDB from '@/services/SERVERDB.js';

import start from './start.js';

/* * */

const RUN_INTERVAL = 60000; // 60 seconds

/* * */

(async function init() {
	//

	await SERVERDB.connect();
	await PCGIDB.connect();

	const runOnInterval = async () => {
		await start();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
