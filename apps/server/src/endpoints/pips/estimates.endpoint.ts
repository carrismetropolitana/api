/* * */

import DATES from '@/services/DATES.js';
import { FASTIFY } from '@/services/FASTIFY.js';
import { findStopByFlagStopId, getStops, GO_BASE_URL, HubEtaData } from '@/services/GO.js';
import { HubV1ApiPattern } from '@tmlmobilidade/go-types-hub';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { fetchData } from '@tmlmobilidade/utils';
import { DateTime } from 'luxon';

import { buildEstimatedArrival, buildScheduledArrival, findMatchingEta } from './build-arrivals.js';
import { getSpecialCaseResponse } from './special-cases.js';
import { createPipArrivalResponseItem, PipArrivalRequestSchema, PipArrivalResponseItem } from './types.js';

/* * */

FASTIFY.server.post<PipArrivalRequestSchema>('/pips/estimates', async (request, reply) => {
	//

	//
	// Ensure that the request has a body with an array of Stop IDs,
	// and that each Stop ID is a valid 6-digit string.

	if (!request.body?.stops || request.body.stops.length === 0) {
		return reply.code(400).send([]);
	}

	//
	// Check for special-case stop IDs used in PIP testing

	const specialCaseResponse = getSpecialCaseResponse(request.body.stops);
	if (specialCaseResponse) {
		return reply
			.code(200)
			.header('cache-control', 'public, no-cache')
			.send(specialCaseResponse);
	}

	//
	// Ensure that all stop IDs are valid 6-digit strings

	const regexPatternForStopId = /^\d{6}$/;
	const allStopIdsAreValid = request.body.stops.every(stopId => regexPatternForStopId.test(stopId));
	if (!allStopIdsAreValid) {
		return reply.code(400).send([]);
	}

	//
	// Fetch all stops from the GO API (cached)

	const allStops = await getStops();
	if (!allStops) {
		return reply.code(200).send([]);
	}

	//
	// For each requested stop, fetch patterns and ETA data from GO

	const nowUnix = DateTime.local({ zone: 'Europe/Lisbon' }).toUTC().toUnixInteger();
	const operationalDate = Dates.now('Europe/Lisbon').operational_date_int;
	const allEstimates: PipArrivalResponseItem[] = [];

	for (const stopId of request.body.stops) {
		const stop = findStopByFlagStopId(allStops, stopId);
		if (!stop) continue;

		// Fetch patterns and ETA in parallel
		const [patternResponses, etaData] = await Promise.all([
			Promise.all(stop.pattern_ids.map(pid => fetchData<HubV1ApiPattern[]>(GO_BASE_URL + `/network/patterns/${pid}`))),
			fetchData<HubEtaData[]>(GO_BASE_URL + `/realtime/eta/by-stop/${stop._id}`),
		]);

		const patternData = patternResponses.flatMap(r => r.data);

		for (const pattern of patternData) {
			const lastStopSequence = pattern.trips?.[0]?.schedule?.at(-1)?.stop_sequence;

			for (const tripData of pattern.trips) {
				if (!tripData.valid_on.includes(operationalDate)) continue;

				for (const stopTime of tripData.schedule) {
					if (String(stopTime.stop_id) !== String(stop._id)) continue;
					if (stopTime.stop_sequence === lastStopSequence) continue;

					const scheduledUnixSeconds = DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(stopTime.arrival_time);
					const eta = findMatchingEta(etaData?.data, tripData.trip_ids);

					if (eta?.eta_at != null) {
						const etaUnixSeconds = eta.eta_at / 1000;
						if (etaUnixSeconds < nowUnix) continue;

						allEstimates.push(buildEstimatedArrival({
							eta,
							etaUnixSeconds,
							nowUnix,
							pattern,
							timetabledArrivalTime: stopTime.arrival_time,
						}));
					}
					else {
						if (scheduledUnixSeconds < nowUnix) continue;

						const scheduled = buildScheduledArrival({
							nowUnix,
							pattern,
							scheduledUnixSeconds,
							timetabledArrivalTime: stopTime.arrival_time,
						});
						if (scheduled) allEstimates.push(scheduled);
					}
				}
			}
		}
	}

	//
	// Sort by time and limit to 8 results

	const result = allEstimates
		.sort((a, b) => a.estimatedTimeUnixSeconds - b.estimatedTimeUnixSeconds)
		.slice(0, 8);

	//
	// Handle the case where there are no estimates

	if (!result.length) {
		const response: PipArrivalResponseItem[] = [
			createPipArrivalResponseItem({
				estimatedTimeString: '1 min',
				lineId: 'INFO',
				stopHeadsign: 'Sem estimativas em tempo real.',
			}),

			createPipArrivalResponseItem({
				estimatedTimeString: '1 min',
				journeyId: '0000_0_1|teste',
				lineId: 'INFO',
				observedVehicleId: '0001',
				patternId: '0000_0_1',
				stopHeadsign: 'Consulte o site para +info.',
			}),
		];
		return reply
			.code(200)
			.header('cache-control', 'public, no-cache')
			.send(response);
	}

	return reply
		.code(200)
		.header('cache-control', 'public, no-cache')
		.send(result);

	//
});
