/* * */

import type { Alert } from '@carrismetropolitana/api-types/gtfs-core';

/* * */

export default function parseAlertV2(item): Alert {
	//
	const parsedInformedEntity = item.alert.informed_entity.map((entity) => {
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
		...item.alert,
		alert_id: item.id,
		informed_entity: parsedInformedEntity,
	};

	//
};
