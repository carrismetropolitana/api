/* * */

import DATES from '@/services/DATES.js';
import PCGIAPI from '@/services/PCGIAPI.js';
import SERVERDB from '@/services/SERVERDB.js';
import { DateTime } from 'luxon';

/* * */

const regexPatternForStopId = /^\d{6}$/; // String with exactly 6 numeric digits

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.client.get('stops:all');
	reply.header('Content-Type', 'application/json');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || '[]');
};

/* * */

const single = async (request, reply) => {
	if (!regexPatternForStopId.test(request.params.id)) return reply.status(400).send([]);
	const singleItem = await SERVERDB.client.get(`stops:${request.params.id}`);
	reply.header('Content-Type', 'application/json');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || '{}');
};

/* * */

const singleWithRealtime = async (request, reply) => {
	//
	//   return reply.code(503).send([]);
	//

	const currentArchiveIds = {};

	const allArchivesTxt = await SERVERDB.client.get('archives:all');
	const allArchivesData = JSON.parse(allArchivesTxt);

	for (const archiveData of allArchivesData) {
		const archiveStartDate = DateTime.fromFormat(archiveData.start_date, 'yyyyMMdd');
		const archiveEndDate = DateTime.fromFormat(archiveData.end_date, 'yyyyMMdd');
		if (archiveStartDate > DateTime.now() || archiveEndDate < DateTime.now()) continue;
		else currentArchiveIds[archiveData.operator_id] = archiveData.id;
	}

	if (!regexPatternForStopId.test(request.params.id)) return reply.status(400).send([]);
	const response = await PCGIAPI.request(`opcoreconsole/rt/stop-etas/${request.params.id}`);
	const result = response.map((estimate) => {
		return {
			estimated_arrival: estimate.stopArrivalEta || estimate.stopDepartureEta,
			estimated_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopArrivalEta) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopDepartureEta),
			headsign: estimate.tripHeadsign,
			line_id: estimate.lineId,
			observed_arrival: estimate.stopObservedArrivalTime || estimate.stopObservedDepartureTime,
			observed_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopObservedArrivalTime) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopObservedDepartureTime),
			pattern_id: estimate.patternId,
			route_id: estimate.routeId,
			scheduled_arrival: estimate.stopScheduledArrivalTime || estimate.stopScheduledDepartureTime,
			scheduled_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopScheduledArrivalTime) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopScheduledDepartureTime),
			stop_sequence: estimate.stopSequence,
			trip_id: `${estimate.tripId}_${currentArchiveIds[estimate.agencyId]}`,
			vehicle_id: estimate.observedVehicleId,
		};
	});
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(result || []);
};

/* * */

export default {
	all,
	single,
	singleWithRealtime,
};
