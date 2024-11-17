/* * */

import DATES from '@/services/DATES.js';
import { FASTIFY } from '@/services/FASTIFY.js';
import { PCGIAPI } from '@carrismetropolitana/api-services';
import { DateTime } from 'luxon';

/* * */

interface RequestSchema {
	Body: {
		stops: string[]
	}
}

interface PipArrival {
	estimatedArrivalTime: string
	estimatedDepartureTime: string
	estimatedTimeString: string
	estimatedTimeUnixSeconds: number
	journeyId: string
	lineId: string
	observedArrivalTime: string
	observedDepartureTime: string
	observedDriverId: string
	observedVehicleId: string
	operatorId: string
	patternId: string
	stopHeadsign: string
	stopId: string
	timetabledArrivalTime: string
	timetabledDepartureTime: string
}

/* * */

FASTIFY.server.post<RequestSchema>('/pips/estimates', async (request, reply) => {
	//

	//
	// Ensure that the request has a body with an array of Stop IDs,
	// and that each Stop ID is a valid 6-digit string.

	if (!request.body?.stops || request.body.stops.length === 0) {
		return reply.code(400).send([]);
	}

	const regexPatternForStopId = /^\d{6}$/; // Match a string with exactly 6 numeric digits
	const allStopIdsAreValid = request.body.stops.every(stopId => regexPatternForStopId.test(stopId));
	if (!allStopIdsAreValid) {
		return reply.code(400).send([]);
	}

	//
	// Loop through each stop in the request to check for special cases

	for (const stopId of request.body.stops) {
		//

		//
		// Handle the special case for testing PIP connectivity
		// If the stop ID is '000000', return a single test estimate

		if (stopId === '000000') {
			const response: PipArrival[] = [
				{
					estimatedArrivalTime: '23:59:59',
					estimatedDepartureTime: '23:59:59',
					estimatedTimeString: 'TEST',
					estimatedTimeUnixSeconds: 0,
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
				{
					estimatedArrivalTime: '23:59:59',
					estimatedDepartureTime: '23:59:59',
					estimatedTimeString: '›››',
					estimatedTimeUnixSeconds: 0,
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
			];
			return reply
				.code(200)
				.header('cache-control', 'public, no-cache')
				.send(response);
		}

		//
		// Handle the special case for testing PIP downtime
		// If the stop ID is '000001', return an informational error message

		if (stopId === '000001') {
			const response: PipArrival[] = [
				{
					estimatedArrivalTime: '23:59:59',
					estimatedDepartureTime: '23:59:59',
					estimatedTimeString: '1 min',
					estimatedTimeUnixSeconds: 0,
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
			];
			return reply
				.code(200)
				.header('cache-control', 'public, no-cache')
				.send(response);
		}
	}

	//
	// Request PCGI API for the estimated arrival times for the stops in the request

	const requestedStopIdsList = request.body.stops.join(',');
	const pcgiApiResponse = await PCGIAPI.request(`opcoreconsole/rt/stop-etas/${requestedStopIdsList}`);

	//
	// Parse the result into the expected PIP style

	const result = pcgiApiResponse
		.filter((estimate) => {
			// Check if this estimate has all required fields
			const hasScheduledTime = (estimate.stopScheduledArrivalTime !== null && estimate.stopScheduledArrivalTime !== undefined) || (estimate.stopScheduledDepartuteTime !== null && estimate.stopScheduledDepartuteTime !== undefined);
			const hasEstimatedTime = (estimate.stopArrivalEta !== null && estimate.stopArrivalEta !== undefined) || (estimate.stopDepartureEta !== null && estimate.stopDepartureEta !== undefined);
			const hasObservedTime = (estimate.stopObservedArrivalTime !== null && estimate.stopObservedArrivalTime !== undefined) || (estimate.stopObservedDepartureTime !== null && estimate.stopObservedDepartureTime !== undefined);
			// Check if the scheduled time for this estimate is in the past
			const compensatedScheduledArrival = DATES.compensate24HourRegularStringInto24HourPlusOperationTimeString(estimate.stopScheduledArrivalTime) || DATES.compensate24HourRegularStringInto24HourPlusOperationTimeString(estimate.stopScheduledDepartuteTime);
			const scheduledTimeInUnixSeconds = DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(compensatedScheduledArrival);
			const isThisScheduleInThePast = scheduledTimeInUnixSeconds < DateTime.local({ zone: 'Europe/Lisbon' }).toUTC().toUnixInteger();
			// Check if the estimated time for this estimate is in the past
			const compensatedEstimatedArrival = DATES.compensate24HourRegularStringInto24HourPlusOperationTimeString(estimate.stopArrivalEta) || DATES.compensate24HourRegularStringInto24HourPlusOperationTimeString(estimate.stopDepartureEta);
			const estimatedTimeInUnixSeconds = DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(compensatedEstimatedArrival);
			const isThisEstimateInThePast = estimatedTimeInUnixSeconds < DateTime.local({ zone: 'Europe/Lisbon' }).toUTC().toUnixInteger();
			// Skip this estimate if it has no scheduled time or if it has an observed time
			if (!hasScheduledTime || hasObservedTime) return false;
			// Skip this estimate if it has an estimated time in the past
			if (hasEstimatedTime && isThisEstimateInThePast) return false;
			// Skip this estimate if it does not have estimatedTime and has a scheduled time in the past
			if (!hasEstimatedTime && hasScheduledTime && isThisScheduleInThePast) return false;
			// Include this estimate othewise
			return true;
			//
		})
		.map((estimate): PipArrival => {
			// Transform scheduled time into unix and string formats
			const hasScheduledTime = (estimate.stopScheduledArrivalTime !== null && estimate.stopScheduledArrivalTime !== undefined) || (estimate.stopScheduledDepartuteTime !== null && estimate.stopScheduledDepartuteTime !== undefined);
			const compensatedScheduledArrival = DATES.compensate24HourRegularStringInto24HourPlusOperationTimeString(estimate.stopScheduledArrivalTime) || DATES.compensate24HourRegularStringInto24HourPlusOperationTimeString(estimate.stopScheduledDepartuteTime);
			const scheduledTimeInUnixSeconds = DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(compensatedScheduledArrival);
			const scheduledTimeInSeconds = scheduledTimeInUnixSeconds - DateTime.local({ zone: 'Europe/Lisbon' }).toUTC().toUnixInteger();
			const scheduledTimeInMinutes = Math.floor(scheduledTimeInSeconds / 60);
			// Transform estimated time into unix and string formats
			const hasEstimatedTime = (estimate.stopArrivalEta !== null && estimate.stopArrivalEta !== undefined) || (estimate.stopDepartureEta !== null && estimate.stopDepartureEta !== undefined);
			const compensatedEstimatedArrival = DATES.compensate24HourRegularStringInto24HourPlusOperationTimeString(estimate.stopArrivalEta) || DATES.compensate24HourRegularStringInto24HourPlusOperationTimeString(estimate.stopDepartureEta);
			const estimatedTimeInUnixSeconds = DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(compensatedEstimatedArrival);
			const estimatedTimeInSeconds = estimatedTimeInUnixSeconds - DateTime.local({ zone: 'Europe/Lisbon' }).toUTC().toUnixInteger();
			const estimatedTimeInMinutes = Math.floor(estimatedTimeInSeconds / 60);
			//
			if (hasEstimatedTime && estimatedTimeInMinutes < 1) {
				return {
					estimatedArrivalTime: compensatedEstimatedArrival,
					estimatedDepartureTime: compensatedEstimatedArrival,
					estimatedTimeString: `A chegar`,
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
			}
			//
			if (hasEstimatedTime) {
				return {
					estimatedArrivalTime: compensatedEstimatedArrival,
					estimatedDepartureTime: compensatedEstimatedArrival,
					estimatedTimeString: `• ${estimatedTimeInMinutes} min`,
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
			}
			//
			if (hasScheduledTime && compensatedScheduledArrival && scheduledTimeInMinutes > 0) {
				return {
					estimatedArrivalTime: compensatedScheduledArrival,
					estimatedDepartureTime: compensatedScheduledArrival,
					estimatedTimeString: compensatedScheduledArrival.substring(0, 5),
					estimatedTimeUnixSeconds: scheduledTimeInUnixSeconds,
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
					timetabledArrivalTime: estimate.stopScheduledArrivalTime || estimate.stopScheduledDepartuteTime,
					timetabledDepartureTime: estimate.stopScheduledArrivalTime || estimate.stopScheduledDepartuteTime,
				};
			}
		})
		.sort((a: PipArrival, b: PipArrival) => {
			return a.estimatedTimeUnixSeconds - b.estimatedTimeUnixSeconds;
		}).slice(0, 8);

	//
	// Handle the case where the result is an empty array (there are no estimates right now).
	// In this case we return a single estimate with a generic message.

	if (!result.length) {
		const response: PipArrival[] = [
			{
				estimatedArrivalTime: '23:59:59',
				estimatedDepartureTime: '23:59:59',
				estimatedTimeString: '1 min',
				estimatedTimeUnixSeconds: 0,
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
				estimatedTimeUnixSeconds: 0,
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
		];
		return reply
			.code(200)
			.header('cache-control', 'public, no-cache')
			.send(response);
	}

	//
	// Return the result if there are estimates

	return reply
		.code(200)
		.header('cache-control', 'public, no-cache')
		.send(result);

	//
});
