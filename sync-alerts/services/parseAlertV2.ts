/* * */

import type { Alert } from '@/types/alerts.types.js';

/* * */

export default function parseAlertV2(item): Alert {
	//

	const parsedInformedEntity = item.alert.informedEntity.map((entity) => {
		if (entity.routeId) {
			return {
				lineId: entity.routeId.substring(0, 4),
				...entity,
			};
		}
		return entity;
	});

	return {
		...item.alert,
		alert_id: item.id,
		informedEntity: parsedInformedEntity,
	};

	//
};
