/* * */

import 'dotenv/config';
import start from './start';
import { RUN_INTERVAL, SINGLE_RUN } from '@/config/settings';

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		await start();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	if (SINGLE_RUN) {
		let success = false;
		while (!success) {
			try {
				await start();
				success = true;
			} catch (error) {
				console.error(error);
			}
		}
	} else {
		runOnInterval();
	}

	//
})();