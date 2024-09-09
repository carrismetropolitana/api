/* * */

export default function parseAlertV2(item) {
	//

	const parsedInformedEntity = item.alert.informedEntity.map((entity) => {
		console.log('-----------------------------------------------');
		console.log('entity', entity);
		console.log('---');
		if (entity.routeId) {
			console.log('entity.routeId', entity.routeId);
			return {
				lineId: entity.routeId.substring(0, 4),
				...entity,
			};
		}
		console.log('-----------------------------------------------');
		return entity;
	});

	return {
		alert_id: item.id,
		informedEntity: parsedInformedEntity,
		...item.alert,
	};

	//
};
