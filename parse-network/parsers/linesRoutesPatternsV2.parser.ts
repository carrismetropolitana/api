/* * */

import type { GTFSCalendarDate, GTFSRoute, GTFSStopTime, GTFSTrip, MonStop } from '@/services/NETWORKDB.types.js';
import type { Line, PatternGroup, Route } from '@/services/SERVERDB.types.js';

import sortCollator from '@/modules/sortCollator.js';
import NETWORKDB from '@/services/NETWORKDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import TIMETRACKER from '@/services/TIMETRACKER.js';
import crypto from 'node:crypto';

/* * */

export default async () => {
	//

	/* * *
   * INTRODUCTION
   *
   * The goal of this script is to parse one GTFS feed into a cohesive and intuitive JSON representation.
   * GTFS feeds are notoriously big and contain a lot of duplicated data, which maybe makes sense for GTFS
   * but for an API might be too expensive. Therefore, here we try to condense the information, reducing duplication,
   * by structuring network data into three main levels:
   * (1) The first level is the line, which is the highest level grouping, usually indentified by a 4 digit ID.
   * A line does not have schedules or path, since it represents a <group> of similar routes and patterns that serve
   * an area with a given intent.
   * (2) The second level is the route. There is no hard limit on how many routes one line can have, but there is effort
   * to keep this number low. The route is identified by the 4 digits of the parent line_id followed by an underscore
   * and a zero based index. For example, line_id 1234 would have routes 1234_0, 1234_1, etc. A route also has no schedules
   * or path, but it contains references to child patterns that actually describe the available service.
   * (3) The pattern is a logic representation of a direction of a route. One route can have at most two patterns, one for each direction.
   * A pattern is built from the unique combination of trips with the same route_id, direction_id, trip_headsign, shape_id and stop_sequence.
   * It is important to note that the pattern is not part of the GTFS standard, but a common way to structure network data in a logical
   * and familiar way for passengers. In the current iteration of this API, it is sometimes necessary to create multiple versions of the same patten,
   * in order to be able to present the evolution of the network. For example, a pattern may change shape or stops starting next month,
   * and both versions need to be available for the consumers of this API. This is why one pattern can actually have multiple pattern groups.
   * (3.1) One pattern group represents a particular version of that pattern. All pattern groups have the same pattern ID (which is composed
   * of the parent route ID followed by an underscore and the direction ID of the GTFS trips used to build it) but each group is valid on a different
   * set of dates. This is what should control the pattern group visibility in a frontend application. It is the pattern group that has a path,
   * an associated shape and a set of schedules for each serviced stop.
   * (4) In GTFS, trips are the atomic unit of service. They represent a given sequence of stops serviced on a particular time on set of dates.
   * In this API, we group trips into schedules, which are all the GTFS trips that serve a path at the same time. For example, the 9h trip
   * in a given direction can be found in the GTFS "separated" into 3 distinct trips, since each can have a different associated calendar (set of dates).
   * While this allows for great flexibility in the GTFS format, it makes it hard to consume for users. By grouping trips into schedules,
   * we simplify consumption while improving service readability as a whole. A schedule represents all trips serving the same path at the same time.
   */

	// 1.
	// Setup a global time tracker for this parser

	const globalTimeTracker = new TIMETRACKER('newLinesRoutesPatterns.parser/global');

	// 2.
	// Build hashmaps for GTFS entities that will be reused multiple times.
	// Using hashmaps allows for O(1) lookups instead of linear scans.

	// For Stops
	const allStopsParsedTxt = await SERVERDB.client.get('stops:all');
	const allStopsParsedJson: MonStop[] = JSON.parse(allStopsParsedTxt);
	const allStopsParsedMap = new Map(allStopsParsedJson.map(item => [item.id, item]));

	// For Routes
	const allRoutesRaw = await NETWORKDB.client.query<GTFSRoute>('SELECT * FROM routes');
	const allRoutesRawMap = new Map(allRoutesRaw.rows.map(item => [item.route_id, item]));

	// For Calendar Dates
	const allCalendarDatesRaw = await NETWORKDB.client.query<GTFSCalendarDate>(`SELECT * FROM calendar_dates`);
	const allCalendarDatesRawMap = new Map();
	allCalendarDatesRaw.rows.forEach((item) => {
		if (allCalendarDatesRawMap.has(item.service_id)) {
			allCalendarDatesRawMap.get(item.service_id).push(item.date);
		}
		else {
			allCalendarDatesRawMap.set(item.service_id, [
				item.date,
			]);
		}
	});

	// 3.
	// Setup hashmap variables to hold final parsed data

	const allLinesParsed = {};
	const allRoutesParsed = {};

	const updatedLineKeys = new Set();
	const updatedRouteKeys = new Set();
	const updatedPatternKeys = new Set();

	// 4.
	// Get all distinct Pattern IDs from trips table

	const allDistinctPatternIdsRaw = await NETWORKDB.client.query<{ pattern_id: string }>(`SELECT DISTINCT pattern_id FROM trips`);
	const allDistinctPatternIdsData = allDistinctPatternIdsRaw.rows.map(item => item.pattern_id);

	// 5.
	// For each distinct pattern_id, parse trips into patterns and schedules.
	// GTFS is built with trips as the central point holding most other entities together.
	// By starting with trips, we can easily extract the patterns, route and line for the whole network,
	// while keeping memory use low by processing one pattern at a time.

	for (const patternId of allDistinctPatternIdsData) {
		//

		// 5.1.
		// Get all trips that match the current pattern ID

		const allTripsForThisPatternRaw = await NETWORKDB.client.query<GTFSTrip>(`SELECT * FROM trips WHERE pattern_id = $1`, [patternId]);

		// 5.2.
		// Setup a variable to hold the parsed pattern groups

		const parsedPatternGroups = {};

		// 5.3.
		// For each trip belonging to the current pattern ID,
		// build the actual pattern groups, merge trips with the save path and arrival times,
		// and create the higher level route and line objects.

		for (const tripRawData of allTripsForThisPatternRaw.rows) {
			//

			// 5.3.1.
			// Get the stop_times data associated with the current trip

			const stopTimesRaw = await NETWORKDB.client.query<GTFSStopTime>(`SELECT * FROM stop_times WHERE trip_id = $1 ORDER BY stop_sequence`, [
				tripRawData.trip_id,
			]);

			// 5.3.2.
			// With the same set of data (stop_times sequence of stops) we can find out different information.
			// By creating a simplified version of path (just IDs) we can detect different itineraries for the same pattern,
			// and this is used to build the pattern groups. The service ID associated with those trips dictactes when
			// this pattern group is valid. The complete path is the one actually saved to the database, since it has full stop details
			// and pickup and dropoff types. To detect trips with the same arrival times at every stop of the path the schedule version is used.
			// These trips are exactly the same, but they have different associated calendars. Depending on the source of the file, or the amount
			// of information associated with each trip, this may be more or less evident. Take the case where the 9h trip happens every day the year,
			// but there is a need to associate different drivers or vehicles (blocks) to each trip, therefore creating the need to separate each run
			// into multiple trips, each with its own calendar. GTFS motivates this separation to allow for flexibility, but it makes for a lot of duplication.
			// By grouping trips with the same schedules we aim to simplify that consumption. Each trip_id is still available to be matched with
			// GTFS-RT feeds if necessary. Also note that, if the 9h trip is faster in the summer than in the winter, that is also caught here, since all
			// arrival times need to be the same for all stops in the path. Finally, each stop in the path has an associated set of facilities served,
			// a locality and a municipality ID. Instead of running these loops multiple times, we run it once and save all the necessary information immediately.

			const stopTimesAsSimplifiedPath = [];
			const stopTimesAsCompletePath = [];

			const stopTimesAsSimplifiedSchedule = [];
			const stopTimesAsCompleteSchedule = [];

			const facilitiesList = new Set();

			const localitiesList = new Set();
			const municipalityIdsList = new Set();

			for (const stopTimeRawData of stopTimesRaw.rows) {
				//

				// 5.3.2.1.
				// Get the current stop data from the map

				const stopParsedData = allStopsParsedMap.get(stopTimeRawData.stop_id);

				// 5.3.2.2.
				// Buld the simplified path with only the stop_id and stop_sequence.
				// This will be used to dictacte if this trip belongs to an existing or a new pattern group.

				stopTimesAsSimplifiedPath.push({
					stop_id: stopTimeRawData.stop_id,
					stop_sequence: stopTimeRawData.stop_sequence,
				});

				// 5.3.2.3.
				// Buld the complete path with stop details and service conditions.
				// This will be the path that is stored alongside this pattern group.

				stopTimesAsCompletePath.push({
					allow_drop_off: stopTimeRawData.drop_off_type !== '1',
					allow_pickup: stopTimeRawData.pickup_type !== '1',
					distance_delta: 0,
					stop: stopParsedData,
					stop_sequence: stopTimeRawData.stop_sequence,
				});

				// 5.3.2.4.
				// Build the simplified schedule version with only arrival times at each stop.
				// This will be used to merge trips that are equal but happen on differnt dates.

				stopTimesAsSimplifiedSchedule.push({
					arrival_time: stopTimeRawData.arrival_time,
					stop_id: stopTimeRawData.stop_id,
					stop_sequence: stopTimeRawData.stop_sequence,
				});

				// 5.3.2.5.
				// Build the complete schedule, with formatted time strings.
				// This will be the schedule that is stored alongside this trip group.

				stopTimesAsCompleteSchedule.push({
					arrival_time: stopTimeRawData.arrival_time,
					arrival_time_24h: transformOperationTimeStringIntoDisplayTimeString(stopTimeRawData.arrival_time),
					stop_id: stopTimeRawData.stop_id,
					stop_sequence: stopTimeRawData.stop_sequence,
				});

				// 5.3.2.6.
				// Add the facilities served by the current stop to the list

				stopParsedData.facilities.forEach(item => facilitiesList.add(item));

				// 5.3.2.7.
				// Add the current stop locality and municipality to the list

				localitiesList.add(stopParsedData.locality);
				municipalityIdsList.add(stopParsedData.municipality_id);

				//
			}

			// 5.3.3.
			// Get the route data associated with this trip from the map

			const routeRawData = allRoutesRawMap.get(tripRawData.route_id);

			// 5.3.4.
			// Create the pattern group object with the fields used to differentiate between each group.
			// A pattern group is differentiated by the fields below, with special focus on direction_id,
			// trip_headsign, shape_id and the simplified version of path (stop_id and stop_sequence).
			// This means that everytime any of these fields differs, a new group will be created,
			// and a different set of dates will be associated with it.

			const currentPatternGroup = {
				color: routeRawData.route_color,
				direction: tripRawData.direction_id,
				headsign: tripRawData.trip_headsign,
				line_id: routeRawData.line_id,
				pattern_id: tripRawData.pattern_id,
				route_id: routeRawData.route_id,
				shape_id: tripRawData.shape_id,
				short_name: routeRawData.route_short_name,
				simplified_path: stopTimesAsSimplifiedPath,
				text_color: routeRawData.route_text_color,
			};

			// 5.3.5.
			// Create a hash of the object to detect if this pattern group already exists

			const currentPatternGroupHash = crypto.createHash('sha256').update(JSON.stringify(currentPatternGroup)).digest('hex');

			// 5.3.6.
			// Check if this pattern group already exists, and create if it doesn't.
			// The created pattern group will have all the complete information not used to differentiate between groups.

			if (!parsedPatternGroups[currentPatternGroupHash]) {
				parsedPatternGroups[currentPatternGroupHash] = {
					color: routeRawData.route_color ? `#${routeRawData.route_color}` : '#000000',
					direction: tripRawData.direction_id,
					facilities: [],
					headsign: tripRawData.trip_headsign,
					line_id: routeRawData.line_id,
					localities: [],
					municipality_ids: [],
					path: stopTimesAsCompletePath,
					pattern_group_id: currentPatternGroupHash,
					pattern_id: tripRawData.pattern_id,
					route_id: routeRawData.route_id,
					shape_id: tripRawData.shape_id,
					short_name: routeRawData.route_short_name,
					text_color: routeRawData.route_text_color ? `#${routeRawData.route_text_color}` : '#000000',
					trip_groups: {}, // A map, not an array
					valid_on: [],
				};
			}

			// 5.3.7.
			// Add to the current pattern group (new or exising) the data retrieved from the current trip

			parsedPatternGroups[currentPatternGroupHash].valid_on = Array.from(new Set([...parsedPatternGroups[currentPatternGroupHash].valid_on, ...allCalendarDatesRawMap.get(tripRawData.service_id)]));
			parsedPatternGroups[currentPatternGroupHash].facilities = Array.from(new Set([...parsedPatternGroups[currentPatternGroupHash].facilities, ...facilitiesList]));
			parsedPatternGroups[currentPatternGroupHash].localities = Array.from(new Set([...parsedPatternGroups[currentPatternGroupHash].localities, ...localitiesList]));
			parsedPatternGroups[currentPatternGroupHash].municipality_ids = Array.from(new Set([...parsedPatternGroups[currentPatternGroupHash].municipality_ids, ...municipalityIdsList]));

			// 5.3.8.
			// Create a simplified version of this trip with the goal of finding the same trip,
			// with the same arrival times on all stops, but with different calendars.
			// Notice we're including the pattern group hash since the same trip cannot be present in different
			// pattern groups, as in they are contained in it. In other words, the uniqueness of a trip is dependent
			// on the pattern group it belongs to.

			const currentTripGroup = {
				direction_id: tripRawData.direction_id,
				pattern_group_hash: currentPatternGroupHash,
				pattern_id: tripRawData.pattern_id,
				route_id: tripRawData.route_id,
				simplified_schedule: stopTimesAsSimplifiedSchedule,
			};

			// 5.3.9.
			// Create a hash of the object to detect if this trip group already exists

			const currentTripGroupHash = crypto.createHash('sha256').update(JSON.stringify(currentTripGroup)).digest('hex');

			// 5.3.10.
			// Check if this trip group already exists, and create if it doesn't.
			// The created trip group will have all the complete information not used to differentiate between groups.

			if (!parsedPatternGroups[currentPatternGroupHash].trip_groups[currentTripGroupHash]) {
				parsedPatternGroups[currentPatternGroupHash].trip_groups[currentTripGroupHash] = {
					dates: [],
					schedule: stopTimesAsCompleteSchedule,
					trip_ids: [],
				};
			}

			// 5.3.11.
			// Add to the current trip group (new or exising) the data retrieved from the current trip

			parsedPatternGroups[currentPatternGroupHash].trip_groups[currentTripGroupHash].dates = Array.from(new Set([...parsedPatternGroups[currentPatternGroupHash].trip_groups[currentTripGroupHash].dates, ...allCalendarDatesRawMap.get(tripRawData.service_id)]));
			parsedPatternGroups[currentPatternGroupHash].trip_groups[currentTripGroupHash].trip_ids = Array.from(new Set([...parsedPatternGroups[currentPatternGroupHash].trip_groups[currentTripGroupHash].trip_ids, tripRawData.trip_id]));

			// 5.3.12.
			// Create the route object if it doesn't exist yet. Notice we're not using hashes here
			// because routes are supposed to be unique in the same GTFS file.

			if (!allRoutesParsed[tripRawData.route_id]) {
				allRoutesParsed[tripRawData.route_id] = {
					color: routeRawData.route_color ? `#${routeRawData.route_color}` : '#000000',
					facilities: [],
					line_id: routeRawData.line_id,
					localities: [],
					long_name: routeRawData.route_long_name,
					municipality_ids: [],
					pattern_ids: [],
					route_id: routeRawData.route_id,
					short_name: routeRawData.route_short_name,
					text_color: routeRawData.route_text_color ? `#${routeRawData.route_text_color}` : '#FFFFFF',
				};
			}

			// 5.3.13.
			// Add to the current route (new or exising) the data retrieved from the current trip

			allRoutesParsed[tripRawData.route_id].pattern_ids = Array.from(new Set([...allRoutesParsed[tripRawData.route_id].pattern_ids, tripRawData.pattern_id]));

			allRoutesParsed[tripRawData.route_id].facilities = Array.from(new Set([...allRoutesParsed[tripRawData.route_id].facilities, ...facilitiesList]));
			allRoutesParsed[tripRawData.route_id].localities = Array.from(new Set([...allRoutesParsed[tripRawData.route_id].localities, ...localitiesList]));
			allRoutesParsed[tripRawData.route_id].municipality_ids = Array.from(new Set([...allRoutesParsed[tripRawData.route_id].municipality_ids, ...municipalityIdsList]));

			// 5.3.14.
			// Create the line object if it doesn't exist yet

			if (!allLinesParsed[routeRawData.line_id]) {
				allLinesParsed[routeRawData.line_id] = {
					color: routeRawData.route_color ? `#${routeRawData.route_color}` : '#000000',
					facilities: [],
					line_id: routeRawData.line_id,
					localities: [],
					long_name: routeRawData.line_long_name,
					municipality_ids: [],
					pattern_ids: [],
					route_ids: [],
					short_name: routeRawData.line_short_name,
					text_color: routeRawData.route_text_color ? `#${routeRawData.route_text_color}` : '#FFFFFF',
				};
			}

			// 5.3.15.
			// Add to the current line (new or exising) the data retrieved from the current trip

			allLinesParsed[routeRawData.line_id].route_ids = Array.from(new Set([...allLinesParsed[routeRawData.line_id].route_ids, tripRawData.route_id]));
			allLinesParsed[routeRawData.line_id].pattern_ids = Array.from(new Set([...allLinesParsed[routeRawData.line_id].pattern_ids, tripRawData.pattern_id]));

			allLinesParsed[routeRawData.line_id].facilities = Array.from(new Set([...allLinesParsed[routeRawData.line_id].facilities, ...facilitiesList]));
			allLinesParsed[routeRawData.line_id].localities = Array.from(new Set([...allLinesParsed[routeRawData.line_id].localities, ...localitiesList]));
			allLinesParsed[routeRawData.line_id].municipality_ids = Array.from(new Set([...allLinesParsed[routeRawData.line_id].municipality_ids, ...municipalityIdsList]));

			//
		}

		// 5.4.
		// After going through all the trips for the current pattern, the time comes to save them to the database.
		// However, a small modification is required. The pattern group contains a trip_groups map that should be converted
		// to an array of trips. Also, the pattern groups themselves should be an array for the current pattern ID.

		const finalizedPatternGroupsData = Object.values(parsedPatternGroups).map((item: PatternGroup) => ({ ...item, trip_groups: Object.values(item.trip_groups) }));

		await SERVERDB.client.set(`network/v2/patterns:${patternId}`, JSON.stringify(finalizedPatternGroupsData));
		updatedPatternKeys.add(`network/v2/patterns:${patternId}`);

		console.log('updated pattern', patternId);

		//
	}

	// 6.
	// Save each and all routes to the database

	const finalizedAllRoutesData: Route[] = (Object.values(allRoutesParsed) as Route[]).sort((a: Route, b: Route) => sortCollator.compare(a.route_id, b.route_id));

	for (const finalizedRouteData of finalizedAllRoutesData) {
		await SERVERDB.client.set(`network/v2/routes:${finalizedRouteData.route_id}`, JSON.stringify(finalizedAllRoutesData));
		updatedRouteKeys.add(`network/v2/routes:${finalizedRouteData.route_id}`);
		console.log('updated route', finalizedRouteData.route_id);
	}

	await SERVERDB.client.set('network/v2/routes:all', JSON.stringify(finalizedAllRoutesData));
	updatedRouteKeys.add('network/v2/routes:all');

	// 6.
	// Save each and all lines to the database

	const finalizedAllLinesData: Line[] = (Object.values(allLinesParsed) as Line[]).sort((a: Line, b: Line) => sortCollator.compare(a.line_id, b.line_id));

	for (const finalizedLineData of finalizedAllLinesData) {
		await SERVERDB.client.set(`network/v2/lines:${finalizedLineData.line_id}`, JSON.stringify(finalizedAllLinesData));
		updatedLineKeys.add(`network/v2/lines:${finalizedLineData.line_id}`);
		console.log('updated line', finalizedLineData.line_id);
	}

	await SERVERDB.client.set('network/v2/lines:all', JSON.stringify(finalizedAllLinesData));
	updatedLineKeys.add('network/v2/lines:all');

	// 7.
	// Delete stale patterns

	const allPatternKeysInTheDatabase = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'network/v2/patterns:*', TYPE: 'string' })) {
		allPatternKeysInTheDatabase.push(key);
	}

	const stalePatternKeys = allPatternKeysInTheDatabase.filter(key => !updatedPatternKeys.has(key));
	if (stalePatternKeys.length) {
		await SERVERDB.client.del(stalePatternKeys);
	}
	console.log(`⤷ Deleted ${stalePatternKeys.length} stale Patterns.`);

	// 7.
	// Delete stale routes

	const allRouteKeysInTheDatabase = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'network/v2/routes:*', TYPE: 'string' })) {
		allRouteKeysInTheDatabase.push(key);
	}

	const staleRouteKeys = allRouteKeysInTheDatabase.filter(key => !updatedRouteKeys.has(key));
	if (staleRouteKeys.length) {
		await SERVERDB.client.del(staleRouteKeys);
	}
	console.log(`⤷ Deleted ${staleRouteKeys.length} stale Routes.`);

	// 7.
	// Delete stale routes

	const allLineKeysInTheDatabase = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'network/v2/lines:*', TYPE: 'string' })) {
		allLineKeysInTheDatabase.push(key);
	}

	const staleLineKeys = allLineKeysInTheDatabase.filter(key => !updatedLineKeys.has(key));
	if (staleLineKeys.length) {
		await SERVERDB.client.del(staleLineKeys);
	}
	console.log(`⤷ Deleted ${staleLineKeys.length} stale Lines.`);

	//
};

/* * */

function transformOperationTimeStringIntoDisplayTimeString(arrivalTimeString: string) {
	// Separate the string into time components [hours:minutes:seconds]
	const arrivalTimeComponents = arrivalTimeString.split(':');
	// Add a zero to the left of the hour component ( 3 -> 03 )
	let arrivalTimeComponentHour = arrivalTimeComponents[0].padStart(2, '0');
	// Check if the hour component is after midnight
	if (arrivalTimeComponentHour && Number(arrivalTimeComponentHour) >= 24) {
		// In this case, rebase it to a 24 hour clock
		const arrivalTimeComponentHourAdjusted = Number(arrivalTimeComponentHour) - 24;
		arrivalTimeComponentHour = String(arrivalTimeComponentHourAdjusted).padStart(2, '0');
	}
	// Add a zero to the left of minutes and seconds
	const arrivalTimeComponentMinutes = arrivalTimeComponents[1].padStart(2, '0');
	const arrivalTimeComponentSeconds = arrivalTimeComponents[2].padStart(2, '0');
	// Return formatted string
	return `${arrivalTimeComponentHour}:${arrivalTimeComponentMinutes}:${arrivalTimeComponentSeconds}`;
	//
}
