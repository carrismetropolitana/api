/* * */

import SERVERDB from '@/services/SERVERDB.js';
import firebase from 'firebase-admin';

import start from './start.js';

/* * */

const RUN_INTERVAL = 30000; // 30 seconds

/* * */

(async function init() {
	//

	await SERVERDB.connect();

	firebase.initializeApp({
		credential: firebase.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
	});

	const runOnInterval = async () => {
		await start();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
