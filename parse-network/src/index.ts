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
		await start();
	} else {
		runOnInterval();
	}

	//
})();