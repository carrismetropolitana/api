/* * */

import { type BackofficeAlertSource } from '@/types/sources.js';
import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { ServiceAlertResponse } from '@tmlmobilidade/types';
import { fetchData } from '@tmlmobilidade/utils';
import { type TopicMessage } from 'firebase-admin/messaging';

/* * */

export const syncAlerts = async () => {
	//

	LOGGER.init();
	const globalTimer = new TIMETRACKER();

	//
	// Fetch all alerts from the backoffice

	const backofficeTimer = new TIMETRACKER();

	const alertsGtfsFeedResponse = await fetchData<ServiceAlertResponse>('https://go.tmlmobilidade.pt/hub/api/v1/alerts/gtfs');

	if (alertsGtfsFeedResponse.error || !alertsGtfsFeedResponse.data) {
		LOGGER.error(`Failed to fetch Alerts GTFS feed from the backoffice: ${alertsGtfsFeedResponse.error}`);
		return;
	}

	const alertsJsonFeedResponse = await fetchData<BackofficeAlertSource[]>('https://go.tmlmobilidade.pt/hub/api/v1/alerts');

	if (alertsJsonFeedResponse.error || !alertsJsonFeedResponse.data) {
		LOGGER.error(`Failed to fetch Alerts JSON feed from the backoffice: ${alertsJsonFeedResponse.error}`);
		return;
	}

	const alertsGtfsFeedData = alertsGtfsFeedResponse.data;
	const alertsJsonFeedData = alertsJsonFeedResponse.data;

	LOGGER.info(`Fetched Alerts feed from the backoffice (${backofficeTimer.get()})`);

	//
	// Prepare the alerts data in Protobuf format
	// (currently no transformation is needed, as the data is already in the "correct" format)

	const protobufTimer = new TIMETRACKER();

	await SERVERDB.set(SERVERDB_KEYS.NETWORK.ALERTS.PROTOBUF, JSON.stringify(alertsGtfsFeedData));

	LOGGER.info(`Saved Protobuf Alerts to ServerDB (${protobufTimer.get()})`);

	//
	// Prepare the alerts data in JSON format

	const jsonTimer = new TIMETRACKER();

	const allAlertsParsedV2 = alertsJsonFeedData;

	await SERVERDB.set(SERVERDB_KEYS.NETWORK.ALERTS.ALL, JSON.stringify(allAlertsParsedV2));

	LOGGER.info(`Saved ${allAlertsParsedV2.length} JSON Alerts to ServerDB (${jsonTimer.get()})`);

	//
	// Send notifications for new alerts

	const notificationsTimer = new TIMETRACKER();

	const allSentNotificationsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.ALERTS.SENT_NOTIFICATIONS) as string;
	const allSentNotifications = await JSON.parse(allSentNotificationsTxt) || [];
	const allSentNotificationsSet = new Set(allSentNotifications);

	// Send the notifications

	let sentNotificationCounter = 0;

	for (const alertItem of allAlertsParsedV2) {
		if (!allSentNotificationsSet.has(alertItem.alert_id)) {
			try {
				for (const entity of alertItem['informed_entity']) {
					// Setup notification message
					const notificationMessage: TopicMessage = {
						apns: {
							payload: {
								aps: {
									mutableContent: true, // to go through the NSE for badge increment
								},
							},
						},
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
					notificationMessage.data.alertId = alertItem.alert_id;
					// Include title
					if (alertItem.header_text?.translation?.length > 0) {
						notificationMessage.notification.title = alertItem.header_text?.translation[0]?.text ?? '';
					}
					// Include description
					if (alertItem.description_text?.translation?.length > 0) {
						const messageDescription = alertItem.description_text?.translation[0]?.text ?? '';
						notificationMessage.notification.body = messageDescription?.length > 200 ? messageDescription.substring(0, 200) + '...' : messageDescription;
					}
					// Include image
					if (alertItem.image?.localized_image?.length > 0) {
						notificationMessage.notification.imageUrl = alertItem.image?.localized_image[0]?.url || undefined;
					}
					// Include topics
					if (entity.route_id) {
						notificationMessage.topic = `cm.realtime.alerts.line.${entity.route_id}`;
					}
					else if (entity.line_id) {
						notificationMessage.topic = `cm.realtime.alerts.line.${entity.line_id}`;
					}
					else if (entity.stop_id) {
						notificationMessage.topic = `cm.realtime.alerts.stop.${entity.stop_id}`;
					}
					else {
						// Do the 'all' topic
						notificationMessage.topic = `cm.everyone`;
					}
					// Include image
					if (alertItem.image?.localized_image?.length > 0) {
						notificationMessage.notification.imageUrl = alertItem.image?.localized_image[0]?.url || undefined;
					}
					// await firebaseAdmin.messaging().send(notificationMessage);
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

	await SERVERDB.set(SERVERDB_KEYS.NETWORK.ALERTS.SENT_NOTIFICATIONS, JSON.stringify(Array.from(allSentNotificationsSet)));

	LOGGER.info(`Sent ${sentNotificationCounter} Notifications (${notificationsTimer.get()})`);

	//

	LOGGER.terminate(`Done with this iteration (${globalTimer.get()})`);

	//
};
