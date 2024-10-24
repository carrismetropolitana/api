/* * */

import DATES from '@/services/DATES.js';
import FASTIFY from '@/services/FASTIFY.js';
import PCGIAPI from '@/services/PCGIAPI.js';
import SERVERDB from '@/services/SERVERDB.js';
import { DateTime } from 'luxon';

/* * */

const single = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`v2:network:patterns:${request.params.id}`);

	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

const realtime = async (request, reply) => {
	//

	const currentArchiveIds = {};

	const allArchivesTxt = await SERVERDB.client.get('v2:network:archives:all');
	const allArchivesData = JSON.parse(allArchivesTxt);

	for (const archiveData of allArchivesData) {
		const archiveStartDate = DateTime.fromFormat(archiveData.start_date, 'yyyyMMdd');
		const archiveEndDate = DateTime.fromFormat(archiveData.end_date, 'yyyyMMdd');
		if (archiveStartDate > DateTime.now() || archiveEndDate < DateTime.now()) continue;
		else currentArchiveIds[archiveData.operator_id] = archiveData.id;
	}

	const singleItem = await SERVERDB.client.get(`v2:network:patterns:${request.params.id}`);
	const singleItemJson = await JSON.parse(singleItem);
	const stopIdsForThisPattern = singleItemJson?.path?.map(item => item.stop.id).join(',');
	const response = await PCGIAPI.request(`opcoreconsole/rt/stop-etas/${stopIdsForThisPattern}`);
	const result = response
		.filter((item) => {
			return item.patternId === request.params.id;
		})
		.map((item) => {
			return {
				estimated_arrival: item.stopArrivalEta || item.stopDepartureEta,
				estimated_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(item.stopArrivalEta) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(item.stopDepartureEta),
				headsign: item.tripHeadsign,
				line_id: item.lineId,
				observed_arrival: item.stopObservedArrivalTime || item.stopObservedDepartureTime,
				observed_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(item.stopObservedArrivalTime) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(item.stopObservedDepartureTime),
				pattern_id: item.patternId,
				route_id: item.routeId,
				scheduled_arrival: item.stopScheduledArrivalTime || item.stopScheduledDepartureTime,
				scheduled_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(item.stopScheduledArrivalTime) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(item.stopScheduledDepartureTime),
				stop_id: item.stopId,
				stop_sequence: item.stopSequence,
				trip_id: `${item.tripId}_${currentArchiveIds[item.agencyId]}`,
				vehicle_id: item.observedVehicleId,
			};
		});
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(result || []);
};

/* * */

FASTIFY.server.get('/v2/patterns/:id', single);
FASTIFY.server.get('/v2/patterns/:id/realtime', realtime);
