/* * */

import PCGIDB from '@/services/PCGIDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import daily from '@/src/daily.js';
import operator from '@/src/operator.js';
import start from '@/src/start.js';
import LOGGER from '@helperkits/logger';
import 'dotenv/config';

/* * */

const HOUR_INTERVAL = 3600000; // 1 hour
const DAY_INTERVAL = 86400000; // 1 day
const FIVE_MINUTE_INTERVAL = 300000; // 5 minutes

/* * */

(async function init() {
	//

	LOGGER.init();

	await SERVERDB.connect();
	await PCGIDB.connect();

	const runEvery5Minutes = async () => {
		operator().catch((error) => {
			LOGGER.divider();
			LOGGER.error(error.stack);
			LOGGER.divider();
		});
		setTimeout(runEvery5Minutes, FIVE_MINUTE_INTERVAL);
	};

	const runEveryHour = async () => {
		start().catch((error) => {
			LOGGER.divider();
			LOGGER.error(error.stack);
			LOGGER.divider();
		});
		setTimeout(runEveryHour, HOUR_INTERVAL);
	};

	const runEveryDay = () => {
		daily().catch ((error) => {
			LOGGER.divider();
			LOGGER.error(error.stack);
			LOGGER.divider();
		});

		setTimeout(runEveryDay, DAY_INTERVAL);
	};

	runEvery5Minutes();
	runEveryHour();
	runEveryDay();

	//
})();
