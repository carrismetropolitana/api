/* * */

import { syncAlerts } from '@/tasks/sync-alerts.js';
import firebase from 'firebase-admin';

/* * */

const RUN_INTERVAL = 30000; // 30 seconds

/* * */

(async function init() {
	//

	firebase.initializeApp({
		credential: firebase.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
	});

	const runOnInterval = async () => {
		await syncAlerts();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
