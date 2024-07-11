/* * */

import PCGIDB from '@/services/PCGIDB.js';
import SERVERDB from '@/services/SERVERDB.js';

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
