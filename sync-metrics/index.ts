/* * */

import PCGIDB from '@/services/PCGIDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import LOGGER from '@helperkits/logger';
import 'dotenv/config';

import daily from './src/daily.js';
import start from './src/start.js';

/* * */

const HOUR_INTERVAL = 3600000; // 1 hour
const DAY_INTERVAL = 86400000; // 1 day

/* * */

(async function init() {
	//

	LOGGER.init();

	await SERVERDB.connect();
	await PCGIDB.connect();

	const runEveryHour = async () => {
		try {
			start();
		}
		catch (error) {
			LOGGER.divider();
			LOGGER.error(error.stack);
			LOGGER.divider();
		}
		setTimeout(runEveryHour, HOUR_INTERVAL);
	};

	const runEveryDay = () => {
		try {
			daily();
		}
		catch (error) {
			LOGGER.divider();
			LOGGER.error(error.stack);
			LOGGER.divider();
		}

		setTimeout(runEveryDay, DAY_INTERVAL);
	};

	runEveryHour();
	runEveryDay();

	//
})();
