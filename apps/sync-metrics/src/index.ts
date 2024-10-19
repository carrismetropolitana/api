/* * */

import { PCGIDB } from '@carrismetropolitana/api-services';
import LOGGER from '@helperkits/logger';
import 'dotenv/config';

import daily from './daily.js';
import operator from './operator.js';
import start from './start.js';

/* * */

const HOUR_INTERVAL = 3600000; // 1 hour
const DAY_INTERVAL = 86400000; // 1 day
const FIVE_MINUTE_INTERVAL = 300000; // 5 minutes

/* * */

(async function init() {
	//

	LOGGER.init();

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
