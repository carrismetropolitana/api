/* * */

import SERVERDB from '@/services/SERVERDB.js';
import syncEncmStatus from '@/tasks/syncEncmStatus.js';

/* * */

(async function init() {
	//

	await SERVERDB.connect();

	//
	// Setup tasks

	await syncEncmStatus();

	//
})();
