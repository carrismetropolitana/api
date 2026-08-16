/* * */

import DATES from '@/services/DATES.js';
import { FASTIFY } from '@/services/FASTIFY.js';
import { PCGIAPI, SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type Pattern, type Plan } from '@carrismetropolitana/api-types/network';
import { getOperationalDay } from '@carrismetropolitana/api-utils';
import { Dates, FORMATS } from '@tmlmobilidade/dates';
import { HubPattern, HubStop } from '@tmlmobilidade/go-types-public-info';
import { UnixTimestamp } from '@tmlmobilidade/types';
import { fetchData } from '@tmlmobilidade/utils';
import fs from 'fs';
import { DateTime } from 'luxon';
import path from 'path';
import { fileURLToPath } from 'url';

/* * */

interface RequestSchema {
	Params: {
		id: string
	}
}

interface Arrival {
	estimated_arrival: null | string
	estimated_arrival_unix: null | number
	headsign: string
	line_id: string
	observed_arrival: null | string
	observed_arrival_unix: null | number
	pattern_id: string
	related_trip_ids?: string[]
	route_id: string
	scheduled_arrival: string
	scheduled_arrival_unix: number
	stop_sequence: number
	trip_id: string
	vehicle_id: null | string
};

interface HubEtaData {
	eta_at: null | UnixTimestamp
	eta_seconds: null | number
	position_created_at: null | string
	stop_id: string
	trip_id: string
	vehicle_id: null | string
}

/* * */

const regexPatternForStopId = /^\d{6}$/; // String with exactly 6 numeric digits

/* * */

const GO_BASE_URL = 'https://go.tmlmobilidade.pt/hub/api/v1';
const STOPS_CACHE_TTL = 1000 * 60 * 15; // 15 minutes
const STOPS_CACHE = { data: [], timestamp: 0 } as { data: HubStop[], timestamp: UnixTimestamp };

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const STOPS_ID_MAP_FILE = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../assets/cm_stop_id_match.json'), 'utf8'));
const STOPS_ID_MAP = new Map<string, number>(STOPS_ID_MAP_FILE.map(item => [item.stop_id, item._id]));

FASTIFY.server.get<RequestSchema, Arrival[]>('/arrivals/by_stop/:id', async (request, reply) => {
	//

	if (!regexPatternForStopId.test(request.params.id)) {
		return reply.status(400).send([]);
	}

	// 1. Get All stops
	// 1.1 Cache is outdated, fetch new data
	if (STOPS_CACHE.timestamp < Dates.now('utc').unix_timestamp - STOPS_CACHE_TTL) {
		const response = await fetchData<HubStop[]>(GO_BASE_URL + '/network/stops');
		if (response.error || !Array.isArray(response.data)) {
			return reply.status(200).send([]);
		}
		STOPS_CACHE.data = response.data;
		STOPS_CACHE.timestamp = Dates.now('utc').unix_timestamp;
	}

	// 1.2 Get data from cache
	const stops = STOPS_CACHE.data;

	// 2. Get stop
	const stop = stops.find(stop => stop._id === STOPS_ID_MAP.get(request.params.id));
	if (!stop) {
		return reply.status(404).send([]);
	}

	// 3. Get All pattern data for this stop
	const patternRequestPromises = stop.pattern_ids.map(patternId => fetchData<HubPattern[]>(GO_BASE_URL + `/network/patterns/${patternId}`));
	const patternResponses = await Promise.all(patternRequestPromises);
	const patternData = patternResponses.flatMap(response => response.data);

	// 4. Fetch Eta data for this stop
	const etaData = await fetchData<HubEtaData[]>(GO_BASE_URL + `/realtime/eta/by-stop/${stop._id}`);

	const arrivals: Arrival[] = [];

	// Loop through each valid pattern, and each trip of the pattern
	for (const pattern of patternData) {
		for (const tripData of pattern.trips) {
			// Skip if this trip is not valid for the selected operational date
			if (!tripData.valid_on.includes(Dates.now('Europe/Lisbon').operational_date)) continue;
			// Loop through each stop time of the trip
			for (const stopTime of tripData.schedule) {
				// Skip if this stop time is not for the selected stop
				if (String(stopTime.stop_id) !== String(stop._id)) continue;

				// ETA
				const eta = etaData?.data?.find(eta => eta.trip_id.substring(eta.trip_id.indexOf(']') + 1) === tripData.trip_ids.find(tripId => tripId.substring(tripId.indexOf(']') + 1) === eta.trip_id.substring(eta.trip_id.indexOf(']') + 1))?.substring(eta.trip_id.indexOf(']') + 1));
				const etaUnixTimestamp = eta?.eta_at ? eta.eta_at / 1000 : null;

				arrivals.push({
					estimated_arrival: etaUnixTimestamp ? Dates.fromUnixTimestamp(etaUnixTimestamp * 1000).setZone('Europe/Lisbon', 'offset_only').toLocaleString(FORMATS.TIME_WITH_SECONDS, 'pt') : null,
					estimated_arrival_unix: etaUnixTimestamp,
					headsign: pattern.headsign,
					line_id: pattern.line_id,
					observed_arrival: null,
					observed_arrival_unix: null,
					pattern_id: pattern._id,
					related_trip_ids: null,
					route_id: pattern.route_id,
					scheduled_arrival: stopTime.arrival_time,
					scheduled_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(stopTime.arrival_time),
					stop_sequence: stopTime.stop_sequence,
					trip_id: eta?.trip_id ?? null,
					vehicle_id: eta?.vehicle_id ?? null,
				});
			}
		}
	}

	arrivals.sort((a, b) => a.scheduled_arrival_unix - b.scheduled_arrival_unix);

	return reply
		.code(200)
		.header('cache-control', 'public, max-age=20')
		.send(arrivals || []);
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
				trip_id: `[${currentPlanIds[item.agencyId]}]${item.tripId}`,
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
