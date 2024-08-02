/* * */

import SERVERDB from '@/services/SERVERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

export default async () => {
	//

	LOGGER.init();

	const globalTimer = new TIMETRACKER();

	//
	// Fetch all alerts from the backoffice

	const backofficeTimer = new TIMETRACKER();

	const alertsFeedResponse = await fetch('https://www.carrismetropolitana.pt/?api=alerts-v2');
	const alertsFeedData = await alertsFeedResponse.json();

	LOGGER.info(`Fetched Alerts feed from the backoffice (${backofficeTimer.get()})`);

	//
	// Prepare the alerts data in JSON and Protobuf formats

	const saveTimer = new TIMETRACKER();

	const allAlertsArray = alertsFeedData?.entity.map(item => ({ _id: item.id, ...item.alert }));
	await SERVERDB.client.set(`v2/network/alerts/json`, JSON.stringify(allAlertsArray));

	await SERVERDB.client.set(`v2/network/alerts/protobuf`, JSON.stringify(alertsFeedData));

	LOGGER.info(`Saved ${allAlertsArray.length} Alerts to ServerDB (${saveTimer.get()})`);

	LOGGER.terminate(`Done with this iteration (${globalTimer.get()})`);

	//
};
