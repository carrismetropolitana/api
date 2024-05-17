/* * */

const SERVERDB = require('../../services/SERVERDB');
const PCGIAPI = require('../../services/PCGIAPI');
const DATES = require('../../services/DATES');

/* * */

module.exports.all = async (request, reply) => {
	// Disabled endpoint
	return reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send([]);
};

/* * */

module.exports.new = async (request, reply) => {
const singleItem = await SERVERDB.client.get(`network/v2/patterns:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || []);
};

/* * */

module.exports.single = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`patterns:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

module.exports.realtime = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`patterns:${request.params.id}`);
	const singleItemJson = await JSON.parse(singleItem);
	const stopIdsForThisPattern = singleItemJson?.path?.map((item) => item.stop.id).join(',');
	const response = await PCGIAPI.request(`opcoreconsole/rt/stop-etas/${stopIdsForThisPattern}`);
	const result = response
		.filter((item) => {
			return item.patternId === request.params.id;
		})
		.map((item) => {
			return {
				stop_id: item.stopId,
				line_id: item.lineId,
				pattern_id: item.patternId,
				route_id: item.routeId,
				trip_id: item.tripId,
				headsign: item.tripHeadsign,
				stop_sequence: item.stopSequence,
				scheduled_arrival: item.stopScheduledArrivalTime || item.stopScheduledDepartureTime,
				scheduled_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(item.stopScheduledArrivalTime) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(item.stopScheduledDepartureTime),
				estimated_arrival: item.stopArrivalEta || item.stopDepartureEta,
				estimated_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(item.stopArrivalEta) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(item.stopDepartureEta),
				observed_arrival: item.stopObservedArrivalTime || item.stopObservedDepartureTime,
				observed_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(item.stopObservedArrivalTime) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(item.stopObservedDepartureTime),
				vehicle_id: item.observedVehicleId,
			};
		});
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(result || []);
};
