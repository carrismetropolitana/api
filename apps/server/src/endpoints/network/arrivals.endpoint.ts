/* * */

import DATES from '@/services/DATES.js';
import { FASTIFY } from '@/services/FASTIFY.js';
import { PCGIAPI, SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type Pattern, type Plan } from '@carrismetropolitana/api-types/network';
import { getOperationalDay } from '@carrismetropolitana/api-utils';
import { DateTime } from 'luxon';

/* * */

interface RequestSchema {
	Params: {
		id: string
	}
}

/* * */

const regexPatternForStopId = /^\d{6}$/; // String with exactly 6 numeric digits

/* * */

FASTIFY.server.get<RequestSchema>('/arrivals/by_stop/:id', async (request, reply) => {
	//

	if (!regexPatternForStopId.test(request.params.id)) {
		return reply.status(400).send([]);
	}

	const currentPlanIds = await getCurrentPlanIds();

	const response = await PCGIAPI.request(`opcoreconsole/rt/stop-etas/${request.params.id}`);

	if (!response || !Array.isArray(response)) {
		return reply.status(200).send([]);
	}

	const result = response?.map((estimate) => {
		const compensatedEstimatedArrival = DATES.compensate24HourRegularStringInto24HourPlusOperationTimeString(estimate.stopArrivalEta) || DATES.compensate24HourRegularStringInto24HourPlusOperationTimeString(estimate.stopDepartureEta);
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
			trip_id: `${estimate.tripId}_${currentPlanIds[estimate.agencyId]}`,
			vehicle_id: estimate.observedVehicleId,
		};
	});
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=20')
		.send(result || []);
});

/* * */

FASTIFY.GET<RequestSchema>('/arrivals/by_pattern/:id', async (request, reply) => {
	//

	const todayDateString = DateTime.now().toFormat('yyyyMMdd');
	const currentPlanIds = await getCurrentPlanIds();

	const foundPatternTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.PATTERNS.ID(request.params.id)) as string;
	const foundPatternData: Pattern[] = await JSON.parse(foundPatternTxt);
	const activePatternsData = foundPatternData?.filter(pattern => pattern.valid_on.includes(todayDateString));

	if (!activePatternsData) {
		return reply.status(404).send([]);
	}

	const stopIdsForThisPattern = activePatternsData.flatMap(item => item.path.map(waypoint => waypoint.stop_id)).join(',');
	const response = await PCGIAPI.request(`opcoreconsole/rt/stop-etas/${stopIdsForThisPattern}`);
	if (!response || !Array.isArray(response)) {
		return reply.status(200).send([]);
	}

	const result = response
		?.filter((item) => {
			return item.patternId === request.params.id;
		})
		?.map((item) => {
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
				trip_id: `${item.tripId}_${currentPlanIds[item.agencyId]}`,
				vehicle_id: item.observedVehicleId,
			};
		});

	return reply
		.code(200)
		.header('cache-control', 'public, max-age=20')
		.send(result || []);
});

/* * */

async function getCurrentPlanIds() {
	const currentPlanIds = {};
	const allPlansTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.PLANS) as string;
	const allPlansData: Plan[] = JSON.parse(allPlansTxt);

	for (const planData of allPlansData) {
		const todayOperationDate = getOperationalDay();
		if (planData.valid_range.start > todayOperationDate || planData.valid_range.end < todayOperationDate) continue;
		else currentPlanIds[planData.agency_id] = planData.id;
	}

	return currentPlanIds;
}
