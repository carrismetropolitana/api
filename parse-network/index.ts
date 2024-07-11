/* * */

import 'dotenv/config';

import start from './start.js';

/* * */

const RUN_INTERVAL = 300000; // 5 minutes
const RUN_MODE = process.env.RUN_MODE || 'interval';

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		await start();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

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
