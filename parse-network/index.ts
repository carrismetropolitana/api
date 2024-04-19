/* * */

import 'dotenv/config';
import start from './start';
import SERVERDB from './services/SERVERDB';
import NETWORKDB from './services/NETWORKDB';
import { RUN_INTERVAL } from './config/settings';

/* * */

(async function init() {
	//

	let TASK_IS_RUNNING = false;

	const runOnInterval = async () => {
		if (TASK_IS_RUNNING) {
			console.log('Tried to start a new task while another task is running.');
		} else {
			TASK_IS_RUNNING = true;
			await start();
			TASK_IS_RUNNING = false;
		}
	};

	console.log();
	console.log('INIT: Connect to databases');

	await SERVERDB.connect();
	await NETWORKDB.connect();

	runOnInterval();

	setInterval(runOnInterval, RUN_INTERVAL);

	//
})();