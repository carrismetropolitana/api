/* * */

import type { Alert } from '@/types/alerts.types.js';
import type { TopicMessage } from 'firebase-admin/messaging';

import parseAlertV2 from '@/services/parseAlertV2.js';
import SERVERDB from '@/services/SERVERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import firebaseAdmin from 'firebase-admin';

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

	const allAlertsParsedV2: Alert[] = alertsFeedData?.entity.map(item => parseAlertV2(item));

	await SERVERDB.client.set(`v2/network/alerts/json`, JSON.stringify(allAlertsParsedV2));

	LOGGER.info(`Saved ${allAlertsParsedV2.length} JSON Alerts to ServerDB (${jsonTimer.get()})`);

	//
	// Send notifications for new alerts

	const notificationsTimer = new TIMETRACKER();

	const allSentNotificationsTxt = await SERVERDB.client.get(`v2/network/alerts/sent_notifications`);
	const allSentNotifications = await JSON.parse(allSentNotificationsTxt) || [];
	const allSentNotificationsSet = new Set(allSentNotifications);

	// Send the notifications

	let sentNotificationCounter = 0;

	for (const alertItem of allAlertsParsedV2) {
		if (!allSentNotificationsSet.has(alertItem.alert_id)) {
			try {
				for (const entity of alertItem.informedEntity) {
					// Setup notification message
					const notificationMessage: TopicMessage = {
						notification: {
							body: '',
							imageUrl: '',
							title: '',
						},
						data: {
							alertId: ''
						},
						topic: '',
					};
					// Include alert id
					notificationMessage.data.alertId = alertItem.alert_id;
					// Include title
					notificationMessage.notification.title = alertItem.headerText?.translation[0]?.text || '';
					// Include description
					const messageDescription = alertItem.descriptionText?.translation[0]?.text || '';
					notificationMessage.notification.body = messageDescription.length > 200 ? messageDescription.substring(0, 200) + '...' : messageDescription;
					// Include image
					notificationMessage.notification.imageUrl = alertItem.image?.localizedImage[0]?.url || undefined;
					// Include topics
					if (entity.routeId) {
						notificationMessage.topic = `cm.realtime.alerts.line.${entity.lineId}`;
					}
					else if (entity.stopId) {
						notificationMessage.topic = `cm.realtime.alerts.stop.${entity.stopId}`;
					}
					else {
						// Do the 'all' topic
						notificationMessage.topic = `cm.everyone`;
					}
					await firebaseAdmin.messaging().send(notificationMessage);
					sentNotificationCounter++;
				}
				allSentNotificationsSet.add(alertItem.alert_id);
				LOGGER.success(`Sent notification for alert: ${alertItem.alert_id}`);
			}
			catch (error) {
				LOGGER.error(`Failed to send notification for alert: ${alertItem.alert_id}`);
				LOGGER.error(error);
				continue;
			}
		}
	}

	await SERVERDB.client.set(`v2/network/alerts/sent_notifications`, JSON.stringify(Array.from(allSentNotificationsSet)));

	LOGGER.info(`Sent ${sentNotificationCounter} Notifications (${notificationsTimer.get()})`);

	//

	LOGGER.terminate(`Done with this iteration (${globalTimer.get()})`);

	//
};
