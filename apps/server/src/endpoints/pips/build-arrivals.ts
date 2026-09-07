/* * */

import { HubEtaData } from '@/services/GO.js';
import { HubV1ApiPattern } from '@tmlmobilidade/go-types-hub';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { DateTime } from 'luxon';

import { createPipArrivalResponseItem, PipArrivalResponseItem } from './types.js';

/* * */

/**
 * Removes the `[agency]` prefix from a GO ID string.
 *
 * Example:
 *   `[CM]1234` → `1234`
 *
 * @param {string} id - The GO ID string, possibly prefixed with `[agency]`.
 * @returns {string} The ID string without the `[agency]` prefix.
 */
function stripAgencyPrefix(id: string): string {
	return id.substring(id.indexOf(']') + 1);
}

/**
 * Finds the first realtime ETA entry whose trip_id matches any of the provided pattern trip's trip_ids.
 *
 * @param {HubEtaData[] | undefined} etas - An array of realtime ETA data objects or undefined.
 * @param {string[]} tripIds - An array of pattern trip IDs to match against.
 * @returns {HubEtaData | undefined} The first HubEtaData object whose trip_id (after stripping agency prefix) matches one of the provided tripIds (also stripped), or undefined if no match is found.
 */
export function findMatchingEta(etas: HubEtaData[] | undefined, tripIds: string[]): HubEtaData | undefined {
	if (!etas?.length) return undefined;
	const tripIdSet = new Set(tripIds.map(stripAgencyPrefix));
	return etas.find(eta => tripIdSet.has(stripAgencyPrefix(eta.trip_id)));
}

/**
 * Constructs a PipArrivalResponseItem representing an estimated arrival based on realtime ETA data.
 *
 * @param {Object} options - The options for building the estimated arrival.
 * @param {HubEtaData} options.eta - The realtime ETA data for the trip.
 * @param {number} options.etaUnixSeconds - The ETA in unix seconds.
 * @param {number} options.nowUnix - The current time in unix seconds.
 * @param {HubV1ApiPattern} options.pattern - The transit pattern associated with the arrival.
 * @param {string} options.timetabledArrivalTime - The scheduled arrival time (timetabled).
 * @returns {PipArrivalResponseItem} - The response item with computed estimated times and journey metadata.
 */
export function buildEstimatedArrival(options: { eta: HubEtaData, etaUnixSeconds: number, nowUnix: number, pattern: HubV1ApiPattern, timetabledArrivalTime: string }): PipArrivalResponseItem {
	const { eta, etaUnixSeconds, nowUnix, pattern, timetabledArrivalTime } = options;

	const minutesUntilArrival = Math.floor((etaUnixSeconds - nowUnix) / 60);
	const clockTime = Dates
		.fromUnixMilliseconds(etaUnixSeconds * 1000)
		.setZone('Europe/Lisbon', 'offset_only')
		.toLocaleString('only_time_with_seconds', 'pt');

	return createPipArrivalResponseItem({
		estimatedArrivalTime: clockTime,
		estimatedDepartureTime: clockTime,
		estimatedTimeString: minutesUntilArrival < 1 ? 'A chegar' : `• ${minutesUntilArrival} min`,
		estimatedTimeUnixSeconds: etaUnixSeconds,
		journeyId: eta.trip_id,
		lineId: stripAgencyPrefix(pattern.line_id),
		observedVehicleId: eta.vehicle_id ?? null,
		patternId: stripAgencyPrefix(pattern._id),
		stopHeadsign: pattern.headsign,
		timetabledArrivalTime,
		timetabledDepartureTime: timetabledArrivalTime,
	});
}

/**
 * Constructs a PipArrivalResponseItem representing a scheduled arrival based on timetable data.
 *
 * @param {Object} options - The options for building the scheduled arrival.
 * @param {number} options.nowUnix - The current time in unix seconds.
 * @param {HubV1ApiPattern} options.pattern - The transit pattern associated with the arrival.
 * @param {number} options.scheduledUnixSeconds - The scheduled arrival time in unix seconds.
 * @param {string} options.timetabledArrivalTime - The scheduled (timetabled) arrival time as a string.
 * @returns {PipArrivalResponseItem | null} - The response item with computed scheduled times and journey metadata,
 *   or null if the scheduled time is in the past or now.
 */
export function buildScheduledArrival(options: { nowUnix: number, pattern: HubV1ApiPattern, scheduledUnixSeconds: number, timetabledArrivalTime: string }): null | PipArrivalResponseItem {
	const { nowUnix, pattern, scheduledUnixSeconds, timetabledArrivalTime } = options;

	const minutesUntilArrival = Math.floor((scheduledUnixSeconds - nowUnix) / 60);
	if (minutesUntilArrival <= 0) return null;

	const clockTime = DateTime
		.fromSeconds(scheduledUnixSeconds, { zone: 'Europe/Lisbon' })
		.toFormat('HH:mm');

	return createPipArrivalResponseItem({
		estimatedArrivalTime: timetabledArrivalTime,
		estimatedDepartureTime: timetabledArrivalTime,
		estimatedTimeString: clockTime,
		estimatedTimeUnixSeconds: scheduledUnixSeconds,
		journeyId: null,
		lineId: stripAgencyPrefix(pattern.line_id),
		observedVehicleId: null,
		patternId: stripAgencyPrefix(pattern._id),
		stopHeadsign: pattern.headsign,
		timetabledArrivalTime,
		timetabledDepartureTime: timetabledArrivalTime,
	});
}
