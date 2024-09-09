/* * */

export default function parseAlertV2(item) {
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
		alert_id: item.id,
		informedEntity: parsedInformedEntity,
		...item.alert,
	};

	//
};
