/* * */

import 'dotenv/config';
import start from './start';
import { RUN_INTERVAL, SINGLE_RUN } from './config/settings';

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		const success = await start();
		if (!success) {
			setTimeout(() => {
				console.log('Retrying in 10 seconds...');
				process.exit(0); // End process
			}, 10000); // after 10 seconds
		}
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	if (SINGLE_RUN) {
		let success = false;
		while (!success) {
			try {
				success = await start();
				await new Promise((resolve) => setTimeout(resolve, 1000)); // after 1 second
			} catch (error) {
				console.error(error);
			}
		}
	} else {
		runOnInterval();
	}

	//
})();