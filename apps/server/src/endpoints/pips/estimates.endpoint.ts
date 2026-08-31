/* * */

import DATES from '@/services/DATES.js';
import { FASTIFY } from '@/services/FASTIFY.js';
import { GO_BASE_URL, getStops, HubEtaData, STOPS_ID_MAP } from '@/services/GO.js';
import { Dates, FORMATS } from '@tmlmobilidade/dates';
import { HubPattern } from '@tmlmobilidade/go-types-public-info';
import { fetchData } from '@tmlmobilidade/utils';
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

		//
		// Handle the special case for testing PIP connectivity
		// If the stop ID is '000000', return a single test estimate

		if (stopId === 'no-service') {
			const response: PipArrival[] = [
				{
					estimatedArrivalTime: '23:59:59',
					estimatedDepartureTime: '23:59:59',
					estimatedTimeString: '',
					estimatedTimeUnixSeconds: 0,
					journeyId: '0000_0_0|teste',
					lineId: 'INFO',
					observedArrivalTime: null,
					observedDepartureTime: null,
					observedDriverId: '', // Deprecated
					observedVehicleId: '0000',
					operatorId: '', // Deprecated
					patternId: '0000_0_0',
					stopHeadsign: 'Paragem desativada.',
					stopId: '', // Deprecated
					timetabledArrivalTime: '23:59:59',
					timetabledDepartureTime: '23:59:59',
				},
				{
					estimatedArrivalTime: '23:59:59',
					estimatedDepartureTime: '23:59:59',
					estimatedTimeString: '',
					estimatedTimeUnixSeconds: 0,
					journeyId: '0000_0_0|teste',
					lineId: 'INFO',
					observedArrivalTime: null,
					observedDepartureTime: null,
					observedDriverId: '', // Deprecated
					observedVehicleId: '0000',
					operatorId: '', // Deprecated
					patternId: '0000_0_0',
					stopHeadsign: 'Painel inativo.',
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
	const operationalDate = Dates.now('Europe/Lisbon').operational_date;
	const allEstimates: PipArrival[] = [];

	for (const stopId of request.body.stops) {
		const goStopId = STOPS_ID_MAP.get(stopId);
		const stop = allStops.find(s => s._id === goStopId);
		if (!stop) continue;

		// Fetch patterns and ETA in parallel
		const [patternResponses, etaData] = await Promise.all([
			Promise.all(stop.pattern_ids.map(pid => fetchData<HubPattern[]>(GO_BASE_URL + `/network/patterns/${pid}`))),
			fetchData<HubEtaData[]>(GO_BASE_URL + `/realtime/eta/by-stop/${stop._id}`),
		]);

		const patternData = patternResponses.flatMap(r => r.data);

		for (const pattern of patternData) {
			const lastStopSequence = pattern.trips?.[0]?.schedule?.at(-1)?.stop_sequence;

			for (const tripData of pattern.trips) {
				if (!tripData.valid_on.includes(operationalDate)) continue;

				for (const stopTime of tripData.schedule) {
					if (String(stopTime.stop_id) !== String(stop._id)) continue;
					// Skip if this is the last stop of the pattern
					if (stopTime.stop_sequence === lastStopSequence) continue;

					const scheduledTimeInUnixSeconds = DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(stopTime.arrival_time);

					// Match ETA
					const eta = etaData?.data?.find(eta =>
						eta.trip_id.substring(eta.trip_id.indexOf(']') + 1)
						=== tripData.trip_ids.find(tripId =>
							tripId.substring(tripId.indexOf(']') + 1)
							=== eta.trip_id.substring(eta.trip_id.indexOf(']') + 1),
						)?.substring(eta.trip_id.indexOf(']') + 1),
					);
					const etaUnixSeconds = eta?.eta_at ? eta.eta_at / 1000 : null;

					const hasEstimatedTime = etaUnixSeconds !== null;
					const isEstimateInThePast = hasEstimatedTime && etaUnixSeconds < nowUnix;
					const isScheduleInThePast = scheduledTimeInUnixSeconds < nowUnix;

					// Skip past estimates
					if (hasEstimatedTime && isEstimateInThePast) continue;
					if (!hasEstimatedTime && isScheduleInThePast) continue;

					// Build the PipArrival
					if (hasEstimatedTime) {
						const estimatedTimeInSeconds = etaUnixSeconds - nowUnix;
						const estimatedTimeInMinutes = Math.floor(estimatedTimeInSeconds / 60);
						const estimatedTimeString = Dates.fromUnixTimestamp(etaUnixSeconds * 1000).setZone('Europe/Lisbon', 'offset_only').toLocaleString(FORMATS.TIME_WITH_SECONDS, 'pt');

						allEstimates.push({
							estimatedArrivalTime: estimatedTimeString,
							estimatedDepartureTime: estimatedTimeString,
							estimatedTimeString: estimatedTimeInMinutes < 1 ? 'A chegar' : `• ${estimatedTimeInMinutes} min`,
							estimatedTimeUnixSeconds: etaUnixSeconds,
							journeyId: eta?.trip_id ?? null,
							lineId: pattern.line_id,
							observedArrivalTime: null,
							observedDepartureTime: null,
							observedDriverId: '', // Deprecated
							observedVehicleId: eta?.vehicle_id ?? null,
							operatorId: '', // Deprecated
							patternId: pattern._id,
							stopHeadsign: pattern.headsign,
							stopId: '', // Deprecated
							timetabledArrivalTime: stopTime.arrival_time,
							timetabledDepartureTime: stopTime.arrival_time,
						});
					}
					else {
						const scheduledTimeInSeconds = scheduledTimeInUnixSeconds - nowUnix;
						const scheduledTimeInMinutes = Math.floor(scheduledTimeInSeconds / 60);
						if (scheduledTimeInMinutes <= 0) continue;

						const scheduledTimeInHumanDate = DateTime.fromSeconds(scheduledTimeInUnixSeconds, { zone: 'Europe/Lisbon' }).toFormat('HH:mm');

						allEstimates.push({
							estimatedArrivalTime: stopTime.arrival_time,
							estimatedDepartureTime: stopTime.arrival_time,
							estimatedTimeString: scheduledTimeInHumanDate,
							estimatedTimeUnixSeconds: scheduledTimeInUnixSeconds,
							journeyId: null,
							lineId: pattern.line_id,
							observedArrivalTime: null,
							observedDepartureTime: null,
							observedDriverId: '', // Deprecated
							observedVehicleId: null,
							operatorId: '', // Deprecated
							patternId: pattern._id,
							stopHeadsign: pattern.headsign,
							stopId: '', // Deprecated
							timetabledArrivalTime: stopTime.arrival_time,
							timetabledDepartureTime: stopTime.arrival_time,
						});
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

	return reply
		.code(200)
		.header('cache-control', 'public, no-cache')
		.send(result);

	//
});
