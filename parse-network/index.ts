/* * */

dotenv.config();
import dotenv from 'dotenv';
import { RUN_INTERVAL } from './config/settings';
import start from './start';
import NETWORKDB from './services/NETWORKDB';
import SERVERDB from './services/SERVERDB';

/* * */

(async function init() {
	//

	// Initiate a flag to detect overlapping runs
	let TASK_IS_RUNNING = false;

	// Define a function that is run on every interval
	async function runOnInterval() {
		// Force restart if an overlapping task is detected.
		if (TASK_IS_RUNNING) throw new Error('Force restart: Overlapping tasks.');
		// Set the flag to TRUE
		TASK_IS_RUNNING = true;
		// Run the program
		await start();
		// Set the flag to FALSE
		TASK_IS_RUNNING = false;
		//
	}

	// Run immediately on init
	console.log();
	console.log('STEP 0.0: Connect to databases');
	await NETWORKDB.connect();
	await SERVERDB.connect();
	runOnInterval();

	// Set the interval
	setInterval(runOnInterval, RUN_INTERVAL);

	//
})();