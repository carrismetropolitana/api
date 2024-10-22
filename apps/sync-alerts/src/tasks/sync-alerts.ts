/* * */

import type { Alert } from '@carrismetropolitana/api-types/alerts';
import type { TopicMessage } from 'firebase-admin/messaging';

import parseAlertV2 from '@/services/parseAlertV2.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

export const syncAlerts = async () => {
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
	// (currently no transformation is needed, as the data is already in the "correct" format)

	const protobufTimer = new TIMETRACKER();

	await SERVERDB.set(SERVERDB_KEYS.NETWORK.ALERTS.ALL, JSON.stringify(alertsFeedData));

	LOGGER.info(`Saved Protobuf Alerts to ServerDB (${protobufTimer.get()})`);

	//
	// Prepare the alerts data in JSON format

	const jsonTimer = new TIMETRACKER();

	const allAlertsParsedV2: Alert[] = alertsFeedData?.entity.map(item => parseAlertV2(item));

	await SERVERDB.set(SERVERDB_KEYS.NETWORK.ALERTS.ALL, JSON.stringify(allAlertsParsedV2));

	LOGGER.info(`Saved ${allAlertsParsedV2.length} JSON Alerts to ServerDB (${jsonTimer.get()})`);

	//
	// Send notifications for new alerts

	const notificationsTimer = new TIMETRACKER();

	const allSentNotificationsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.ALERTS.SENT_NOTIFICATIONS);
	const allSentNotifications = await JSON.parse(allSentNotificationsTxt) || [];
	const allSentNotificationsSet = new Set(allSentNotifications);

	// Send the notifications

	let sentNotificationCounter = 0;

	for (const alertItem of allAlertsParsedV2) {
		if (!allSentNotificationsSet.has(alertItem.id)) {
			try {
				for (const entity of alertItem.informed_entity) {
					// Setup notification message
					const notificationMessage: TopicMessage = {
						data: {
							alertId: '',
						},
						notification: {
							body: '',
							imageUrl: '',
							title: '',
						},
						topic: '',
					};
					// Include alert id
					notificationMessage.data.alertId = alertItem.id;
					// Include title
					notificationMessage.notification.title = alertItem.header_text?.translation[0]?.text || '';
					// Include description
					const messageDescription = alertItem.description_text?.translation[0]?.text || '';
					notificationMessage.notification.body = messageDescription.length > 200 ? messageDescription.substring(0, 200) + '...' : messageDescription;
					// Include image
					notificationMessage.notification.imageUrl = alertItem.image?.localized_image[0]?.url || undefined;
					// Include topics
					if (entity.route_id) {
						notificationMessage.topic = `cm.realtime.alerts.line.${entity.route_id}`;
					}
					else if (entity.stop_id) {
						notificationMessage.topic = `cm.realtime.alerts.stop.${entity.stop_id}`;
					}
					else {
						// Do the 'all' topic
						notificationMessage.topic = `cm.everyone`;
					}
					// await firebaseAdmin.messaging().send(notificationMessage);
					sentNotificationCounter++;
				}
				allSentNotificationsSet.add(alertItem.id);
				LOGGER.success(`Sent notification for alert: ${alertItem.id}`);
			}
			catch (error) {
				LOGGER.error(`Failed to send notification for alert: ${alertItem.id}`);
				LOGGER.error(error);
				continue;
			}
		}
	}

	await SERVERDB.set(SERVERDB_KEYS.NETWORK.ALERTS.SENT_NOTIFICATIONS, JSON.stringify(Array.from(allSentNotificationsSet)));

	LOGGER.info(`Sent ${sentNotificationCounter} Notifications (${notificationsTimer.get()})`);

	//

	LOGGER.terminate(`Done with this iteration (${globalTimer.get()})`);

	//
};
