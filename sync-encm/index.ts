/* * */

import start from './start.js';

/* * */

const RUN_INTERVAL = 1200000; // 20 minutes

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		await start();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
