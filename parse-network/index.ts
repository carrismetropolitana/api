/* * */

import 'dotenv/config';
import start from './start';
import { RUN_INTERVAL } from './config/settings';

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