/* * */

import DATES from '@/services/DATES.js';
import FASTIFY from '@/services/FASTIFY.js';
import PCGIAPI from '@/services/PCGIAPI.js';
import SERVERDB from '@/services/SERVERDB.js';
import { DateTime } from 'luxon';

/* * */

const regexPatternForStopId = /^\d{6}$/; // String with exactly 6 numeric digits

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2/network/stops/all');
	reply.header('Content-Type', 'application/json');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || '[]');
};

/* * */

const single = async (request, reply) => {
	if (!regexPatternForStopId.test(request.params.id)) return reply.status(400).send([]);
	const singleItem = await SERVERDB.client.get(`v2/network/stops/${request.params.id}`);
	reply.header('Content-Type', 'application/json');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || '{}');
};

/* * */

const realtime = async (request, reply) => {
	//
	//   return reply.code(503).send([]);
	//

	const currentArchiveIds = {};

	const allArchivesTxt = await SERVERDB.client.get('v2/network/archives/all');
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
		const compensatedEstimatedArrival = DATES.compensate24HourRegularStringInto24HourPlusOperationTimeString(estimate.stopArrivalEta) || DATES.compensate24HourRegularStringInto24HourPlusOperationTimeString(estimate.stopDepartureEta);
		console.log('------------------------------------');
		console.log('------------------------------------');
		console.log('------------------------------------');
		console.log('------------------------------------');
		console.log('------------------------------------');
		console.log('------------------------------------');
		console.log('estimate.stopArrivalEta', estimate.stopArrivalEta);
		console.log('estimate.stopDepartureEta', estimate.stopDepartureEta);
		console.log('compensatedEstimatedArrival', compensatedEstimatedArrival);
		console.log('------------------------------------');
		console.log('------------------------------------');
		console.log('------------------------------------');
		console.log('estimate', estimate);
		console.log('------------------------------------');
		console.log('------------------------------------');
		console.log('------------------------------------');
		console.log('------------------------------------');
		return {
			estimated_arrival: compensatedEstimatedArrival,
			estimated_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(compensatedEstimatedArrival),
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

FASTIFY.server.get('/stops', all);
FASTIFY.server.get('/stops/:id', single);
FASTIFY.server.get('/stops/:id/realtime', realtime);

FASTIFY.server.get('/v1/stops', all);
FASTIFY.server.get('/v1/stops/:id', single);
FASTIFY.server.get('/v1/stops/:id/realtime', realtime);

FASTIFY.server.get('/v2/stops', all);
FASTIFY.server.get('/v2/stops/:id', single);
FASTIFY.server.get('/v2/stops/:id/realtime', realtime);
