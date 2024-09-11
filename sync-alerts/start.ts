/* * */

import parseAlertV2 from '@/services/parseAlertV2.js';
import SERVERDB from '@/services/SERVERDB.js';
import { Alert } from '@/types/alerts.types.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { messaging } from 'firebase-admin';
import crypto from 'node:crypto';

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
	// Prepare the alerts data in Protobuf format

	const protobufTimer = new TIMETRACKER();

	await SERVERDB.client.set(`v2/network/alerts/protobuf`, JSON.stringify(alertsFeedData));

	LOGGER.info(`Saved Protobuf Alerts to ServerDB (${protobufTimer.get()})`);

	//
	// Prepare the alerts data in JSON format

	const jsonTimer = new TIMETRACKER();

	const allAlertsParsedV2 = alertsFeedData?.entity.map(item => parseAlertV2(item));

	await SERVERDB.client.set(`v2/network/alerts/json`, JSON.stringify(allAlertsParsedV2));

	LOGGER.info(`Saved ${allAlertsParsedV2.length} JSON Alerts to ServerDB (${jsonTimer.get()})`);

	//
	// Send notifications for new alerts

	const notificationsTimer = new TIMETRACKER();

	const allSentNotificationsTxt = await SERVERDB.client.get(`v2/network/alerts/sent_notifications`);
	const allSentNotifications = await JSON.parse(allSentNotificationsTxt);

	const hashFunction = crypto.createHash('sha1');
	const allAlertsParsedV2Hashes = allAlertsParsedV2.map((alertData: Alert) => ({
		alert: alertData,
		hash: hashFunction.update(JSON.stringify(alertData)).digest('hex'),
	}));

	// Send the notifications

	let sentNotificationCounter = 0;

	for (const alertItem of allAlertsParsedV2Hashes as { alert: Alert, hash: string }[]) {
		if (!allSentNotifications.includes(alertItem.hash)) {
			// Send the notification
			try {
				for (const entity of alertItem.alert.informedEntity) {
					await messaging().send({
						data: {},
						notification: {
							body: alertItem.alert.descriptionText[0].text, // TODO: Handle multiple languages
							title: alertItem.alert.headerText[0].text,
						},
						topic: 'cm.realtime.alerts.route.' + entity.routeId,
					});
				}

				sentNotificationCounter++;
				allSentNotifications.push(alertItem.hash);
				LOGGER.success(`Sent notification for alert: ${alertItem.alert._id}`);
			}
			catch (error) {
				LOGGER.error(`Failed to send notification for alert: ${alertItem.alert._id}`);
				LOGGER.error(error);
				continue;
			}
		}
	}

	await SERVERDB.client.set(`v2/network/alerts/sent_notifications`, JSON.stringify(allSentNotifications));

	LOGGER.info(`Sent ${sentNotificationCounter} Notifications (${notificationsTimer.get()})`);

	//

	LOGGER.terminate(`Done with this iteration (${globalTimer.get()})`);

	//
};
