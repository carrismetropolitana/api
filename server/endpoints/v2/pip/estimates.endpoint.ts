/* * */

import DATES from '@/services/DATES.js';
import FASTIFY from '@/services/FASTIFY.js';
import PCGIAPI from '@/services/PCGIAPI.js';
import { DateTime } from 'luxon';

/* * */

const regexPatternForStopId = /^\d{6}$/; // String with exactly 6 numeric digits

/* * */

const main = async (request, reply) => {
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
						estimatedArrivalTime: '23:59:59',
						estimatedDepartureTime: '23:59:59',
						estimatedTimeString: '1 min',
						journeyId: '0000_0_0|teste',
						lineId: '0000',
						observedArrivalTime: null,
						observedDepartureTime: null,
						observedDriverId: '', // Deprecated
						observedVehicleId: '0000',
						operatorId: '', // Deprecated
						patternId: '0000_0_0',
						stopHeadsign: 'Olá :)',
						stopId: '', // Deprecated
						timetabledArrivalTime: '23:59:59',
						timetabledDepartureTime: '23:59:59',
					},
				]);
		}
		if (stopId === '000001') {
			return reply
				.code(200)
				.header('Content-Type', 'application/json; charset=utf-8')
				.send([
					{
						estimatedArrivalTime: '23:59:59',
						estimatedDepartureTime: '23:59:59',
						estimatedTimeString: '1 min',
						journeyId: '0000_0_0|teste',
						lineId: 'INFO',
						observedArrivalTime: null,
						observedDepartureTime: null,
						observedDriverId: '', // Deprecated
						observedVehicleId: '0000',
						operatorId: '', // Deprecated
						patternId: '0000_0_0',
						stopHeadsign: 'Sem estimativas. Consulte site para +info.',
						stopId: '', // Deprecated
						timetabledArrivalTime: '23:59:59',
						timetabledDepartureTime: '23:59:59',
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
				estimatedArrivalTime: estimate.stopArrivalEta || estimate.stopDepartureEta,
				estimatedDepartureTime: estimate.stopArrivalEta || estimate.stopDepartureEta,
				estimatedTimeString: `${estimatedTimeInMinutes} min`,
				estimatedTimeUnixSeconds: estimatedTimeInUnixSeconds,
				journeyId: estimate.tripId,
				lineId: estimate.lineId,
				observedArrivalTime: estimate.stopObservedArrivalTime || estimate.stopObservedDepartureTime,
				observedDepartureTime: estimate.stopObservedArrivalTime || estimate.stopObservedDepartureTime,
				observedDriverId: '', // Deprecated
				observedVehicleId: estimate.observedVehicleId,
				operatorId: '', // Deprecated
				patternId: estimate.patternId,
				stopHeadsign: estimate.tripHeadsign,
				stopId: '', // Deprecated
				timetabledArrivalTime: estimate.stopArrivalEta || estimate.stopDepartureEta,
				timetabledDepartureTime: estimate.stopArrivalEta || estimate.stopDepartureEta,
			};
		})
		.sort((a, b) => a.estimatedTimeUnixSeconds - b.estimatedTimeUnixSeconds);

	if (!result.length) {
		return reply
			.code(200)
			.header('Content-Type', 'application/json; charset=utf-8')
			.send([
				{
					estimatedArrivalTime: '23:59:59',
					estimatedDepartureTime: '23:59:59',
					estimatedTimeString: '1 min',
					journeyId: '0000_0_0|teste',
					lineId: 'INFO',
					observedArrivalTime: null,
					observedDepartureTime: null,
					observedDriverId: '', // Deprecated
					observedVehicleId: '0000',
					operatorId: '', // Deprecated
					patternId: '0000_0_0',
					stopHeadsign: 'Sem estimativas em tempo real.',
					stopId: '', // Deprecated
					timetabledArrivalTime: '23:59:59',
					timetabledDepartureTime: '23:59:59',
				},
				{
					estimatedArrivalTime: '23:59:59',
					estimatedDepartureTime: '23:59:59',
					estimatedTimeString: '1 min',
					journeyId: '0000_0_1|teste',
					lineId: 'INFO',
					observedArrivalTime: null,
					observedDepartureTime: null,
					observedDriverId: '', // Deprecated
					observedVehicleId: '0001',
					operatorId: '', // Deprecated
					patternId: '0000_0_1',
					stopHeadsign: 'Consulte o site para +info.',
					stopId: '', // Deprecated
					timetabledArrivalTime: '23:59:59',
					timetabledDepartureTime: '23:59:59',
				},
			]);
	}

	return reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(result);
	//
};

/* * */

FASTIFY.server.get('/v2/pip/:id/estimates', main);
