/* * */

const SERVERDB = require('../../services/SERVERDB');
const PCGIAPI = require('../../services/PCGIAPI');
const DATES = require('../../services/DATES');
const { DateTime } = require('luxon');

/* * */

const regexPatternForStopId = /^\d{6}$/; // String with exactly 6 numeric digits

/* * */

module.exports.all = async (request, reply) => {
	const allItems = await SERVERDB.client.get('stops:all');
	reply.header('Content-Type', 'application/json');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || '[]');
};

/* * */

module.exports.single = async (request, reply) => {
	if (!regexPatternForStopId.test(request.params.id)) return reply.status(400).send([]);
	const singleItem = await SERVERDB.client.get(`stops:${request.params.id}`);
	reply.header('Content-Type', 'application/json');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || '{}');
};

/* * */

module.exports.singleWithRealtime = async (request, reply) => {
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
			line_id: estimate.lineId,
			pattern_id: estimate.patternId,
			route_id: estimate.routeId,
			trip_id: `${estimate.tripId}_${currentArchiveIds[estimate.agencyId]}`,
			headsign: estimate.tripHeadsign,
			stop_sequence: estimate.stopSequence,
			scheduled_arrival: estimate.stopScheduledArrivalTime || estimate.stopScheduledDepartureTime,
			scheduled_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopScheduledArrivalTime) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopScheduledDepartureTime),
			estimated_arrival: estimate.stopArrivalEta || estimate.stopDepartureEta,
			estimated_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopArrivalEta) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopDepartureEta),
			observed_arrival: estimate.stopObservedArrivalTime || estimate.stopObservedDepartureTime,
			observed_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopObservedArrivalTime) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopObservedDepartureTime),
			vehicle_id: estimate.observedVehicleId,
		};
	});
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(result || []);
};

/* * */

module.exports.realtimeForPips = async (request, reply) => {
	// Validate request body
	if (!request.body?.stops || request.body.stops.length === 0) return reply.code(400).send([]);
	// Validate each requested Stop ID
	for (const stopId of request.body.stops) {
		if (!regexPatternForStopId.test(stopId)) return reply.status(400).send([]);
		if (stopId === '000000') {
			return reply
				.code(200)
				.header('Content-Type', 'application/json; charset=utf-8')
				.send([
					{
						lineId: '0000',
						patternId: '0000_0_0',
						stopHeadsign: 'Olá :)',
						journeyId: '0000_0_0|teste',
						timetabledArrivalTime: '23:59:59',
						timetabledDepartureTime: '23:59:59',
						estimatedArrivalTime: '23:59:59',
						estimatedDepartureTime: '23:59:59',
						observedArrivalTime: null,
						observedDepartureTime: null,
						estimatedTimeString: '1 min',
						observedVehicleId: '0000',
						stopId: '', // Deprecated
						operatorId: '', // Deprecated
						observedDriverId: '', // Deprecated
					},
				]);
		}
		if (stopId === '000001') {
			return reply
				.code(200)
				.header('Content-Type', 'application/json; charset=utf-8')
				.send([
					{
						lineId: 'INFO',
						patternId: '0000_0_0',
						stopHeadsign: 'Sem estimativas. Consulte site para +info.',
						journeyId: '0000_0_0|teste',
						timetabledArrivalTime: '23:59:59',
						timetabledDepartureTime: '23:59:59',
						estimatedArrivalTime: '23:59:59',
						estimatedDepartureTime: '23:59:59',
						observedArrivalTime: null,
						observedDepartureTime: null,
						estimatedTimeString: '1 min',
						observedVehicleId: '0000',
						stopId: '', // Deprecated
						operatorId: '', // Deprecated
						observedDriverId: '', // Deprecated
					},
				]);
		}
	}
	// Parse requested stop into a comma-separated list
	const stopIdsList = request.body.stops.join(',');
	// Fetch the estimates for this stop list
	const response = await PCGIAPI.request(`opcoreconsole/rt/stop-etas/${stopIdsList}`);
	// Parse the result into the expected PIP style
	const result = response
		.filter((estimate) => {
			// Check if this estimate has all required fields
			const hasScheduledTime = (estimate.stopScheduledArrivalTime !== null && estimate.stopScheduledArrivalTime !== undefined) || (estimate.stopScheduledDepartuteTime !== null && estimate.stopScheduledDepartuteTime !== undefined);
			const hasEstimatedTime = (estimate.stopArrivalEta !== null && estimate.stopArrivalEta !== undefined) || (estimate.stopDepartureEta !== null && estimate.stopDepartureEta !== undefined);
			const hasObservedTime = (estimate.stopObservedArrivalTime !== null && estimate.stopObservedArrivalTime !== undefined) || (estimate.stopObservedDepartureTime !== null && estimate.stopObservedDepartureTime !== undefined);
			// Check if the estimated time for this estimate is in the past
			const estimatedTimeInUnixSeconds = DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopArrivalEta) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopDepartureEta);
			const isThisEstimateInThePast = estimatedTimeInUnixSeconds < DateTime.local({ zone: 'Europe/Lisbon' }).toUTC().toUnixInteger();
			// Return true only if estimate has scheduled time, estimated time and no observed time, and if the estimated time is in not the past
			return hasScheduledTime && hasEstimatedTime && !hasObservedTime && !isThisEstimateInThePast;
		})
		.map((estimate) => {
			// Check if the estimated time for this estimate is in the past
			const estimatedTimeInUnixSeconds = DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopArrivalEta) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopDepartureEta);
			const estimatedTimeInSeconds = estimatedTimeInUnixSeconds - DateTime.local({ zone: 'Europe/Lisbon' }).toUTC().toUnixInteger();
			const estimatedTimeInMinutes = Math.floor(estimatedTimeInSeconds / 60);
			//
			return {
				lineId: estimate.lineId,
				patternId: estimate.patternId,
				stopHeadsign: estimate.tripHeadsign,
				journeyId: estimate.tripId,
				timetabledArrivalTime: estimate.stopArrivalEta || estimate.stopDepartureEta,
				timetabledArrivalTime: estimate.stopArrivalEta || estimate.stopDepartureEta,
				timetabledDepartureTime: estimate.stopArrivalEta || estimate.stopDepartureEta,
				estimatedArrivalTime: estimate.stopArrivalEta || estimate.stopDepartureEta,
				estimatedDepartureTime: estimate.stopArrivalEta || estimate.stopDepartureEta,
				observedArrivalTime: estimate.stopObservedArrivalTime || estimate.stopObservedDepartureTime,
				observedDepartureTime: estimate.stopObservedArrivalTime || estimate.stopObservedDepartureTime,
				estimatedTimeString: `${estimatedTimeInMinutes} min`,
				estimatedTimeUnixSeconds: estimatedTimeInUnixSeconds,
				observedVehicleId: estimate.observedVehicleId,
				stopId: '', // Deprecated
				operatorId: '', // Deprecated
				observedDriverId: '', // Deprecated
			};
		})
		.sort((a, b) => a.estimatedTimeUnixSeconds - b.estimatedTimeUnixSeconds);

	if (!result.length) {
		return reply
			.code(200)
			.header('Content-Type', 'application/json; charset=utf-8')
			.send([
				{
					lineId: 'INFO',
					patternId: '0000_0_0',
					stopHeadsign: 'Sem estimativas em tempo real.',
					journeyId: '0000_0_0|teste',
					timetabledArrivalTime: '23:59:59',
					timetabledDepartureTime: '23:59:59',
					estimatedArrivalTime: '23:59:59',
					estimatedDepartureTime: '23:59:59',
					observedArrivalTime: null,
					observedDepartureTime: null,
					estimatedTimeString: '1 min',
					observedVehicleId: '0000',
					stopId: '', // Deprecated
					operatorId: '', // Deprecated
					observedDriverId: '', // Deprecated
				},
				{
					lineId: 'INFO',
					patternId: '0000_0_1',
					stopHeadsign: 'Consulte o site para +info.',
					journeyId: '0000_0_1|teste',
					timetabledArrivalTime: '23:59:59',
					timetabledDepartureTime: '23:59:59',
					estimatedArrivalTime: '23:59:59',
					estimatedDepartureTime: '23:59:59',
					observedArrivalTime: null,
					observedDepartureTime: null,
					estimatedTimeString: '1 min',
					observedVehicleId: '0001',
					stopId: '', // Deprecated
					operatorId: '', // Deprecated
					observedDriverId: '', // Deprecated
				},
			]);
	}

	return reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(result);
	//
};
