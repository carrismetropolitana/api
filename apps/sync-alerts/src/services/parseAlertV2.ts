/* * */

import type { Alert } from '@carrismetropolitana/api-types/gtfs-core';

/* * */

export default function parseAlertV2(item): Alert {

	const alertData = item.alert ?? item;
	const alertId = item.id ?? item.alert_id;
	const parsedInformedEntity = alertData.informed_entity.map((entity) => {
		if (entity.route_id) {
			return {
				line_id: entity.route_id.substring(0, 4),
				...entity,
			};
		}
		if (entity.trip) {
			return {
				line_id: entity.trip.trip_id.substring(7, 11),
				route_id: entity.trip.trip_id.substring(7, 13),
				...entity,
			};
		}
		return entity;
	});

	return {
		...alertData,
		alert_id: alertId,
		coordinates: alertData.coordinates,
		informed_entity: parsedInformedEntity,
	};

	//
};
