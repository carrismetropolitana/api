/* * */

import type { Line, Location, Path, Pattern, PatternGroup, Route, Schedule, Stop, TripGroup } from '@carrismetropolitana/api-types/src/api/index.js';

import sortCollator from '@/modules/sortCollator.js';
import { NETWORKDB } from '@carrismetropolitana/api-services';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { Alight, CalendarDatesExtended, RouteExtended, StopTimesExtended, TripsExtended } from '@carrismetropolitana/api-types/src/gtfs/index.js';
import tts from '@carrismetropolitana/tts';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import crypto from 'node:crypto';

/* * */

export const syncLinesRoutesPatterns = async () => {
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

	LOGGER.title(`Sync Lines, Routes and Patterns`);
	const globalTimer = new TIMETRACKER();

	//
	// Build hashmaps for GTFS entities that will be reused multiple times.
	// Using hashmaps allows for O(1) lookups instead of linear scans.

	const fetchRawDataTimer = new TIMETRACKER();

	// For Stops
	const allStopsParsedTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.STOPS);
	const allStopsParsedJson: Stop[] = JSON.parse(allStopsParsedTxt);
	const allStopsParsedMap = new Map(allStopsParsedJson.map(item => [item.stop_id, item]));

	// For Routes
	const allRoutesRaw = await NETWORKDB.client.query<RouteExtended>('SELECT * FROM routes');
	const allRoutesRawMap = new Map(allRoutesRaw.rows.map(item => [item.route_id, item]));

	// For Calendar Dates
	const allCalendarDatesRaw = await NETWORKDB.client.query<CalendarDatesExtended>(`SELECT * FROM calendar_dates`);
	const allCalendarDatesRawMap = new Map();
	allCalendarDatesRaw.rows.forEach((item) => {
		if (allCalendarDatesRawMap.has(item.service_id)) {
			allCalendarDatesRawMap.get(item.service_id).push(item.date);
		}
		else {
			allCalendarDatesRawMap.set(item.service_id, [item.date]);
		}
	});

	// Get all distinct Pattern IDs from trips table
	const allDistinctPatternIdsRaw = await NETWORKDB.client.query<{ pattern_id: string }>(`SELECT DISTINCT pattern_id FROM trips LIMIT 10`);
	const allDistinctPatternIds = allDistinctPatternIdsRaw.rows.map(item => item.pattern_id);

	LOGGER.info(`Fetched ${allDistinctPatternIdsRaw.rowCount} rows from NETWORKDB (${fetchRawDataTimer.get()})`);

	//
	// For each distinct pattern_id, parse trips into patterns and schedules.
	// GTFS is built with trips as the central point holding most other entities together.
	// By starting with trips, we can easily extract the patterns, route and line for the whole network,
	// while keeping memory use low by processing one pattern at a time.

	const processPatternsTimer = new TIMETRACKER();

	const allLinesParsed = new Map<string, Line>();
	const allRoutesParsed = new Map<string, Route>();
	const updatedPatternKeys = new Set<string>();

	for (const patternId of allDistinctPatternIds) {
		//

		//
		// Get all trips that match the current pattern ID

		const allTripsForThisPatternRaw = await NETWORKDB.client.query<TripsExtended>(`SELECT * FROM trips WHERE pattern_id = $1`, [patternId]);

		//
		// Setup a variable to hold the parsed pattern groups

		const parsedPatternsForThisPatternGroup = new Map<string, Pattern>();

		//
		// For each trip belonging to the current pattern ID,
		// build the actual pattern groups, merge trips with the saved path and arrival times,
		// and create the higher level route and line objects.

		for (const tripRawData of allTripsForThisPatternRaw.rows) {
			//

			//
			// Get the stop_times data associated with the current trip

			const stopTimesRaw = await NETWORKDB.client.query<StopTimesExtended>(`SELECT * FROM stop_times WHERE trip_id = $1 ORDER BY stop_sequence`, [tripRawData.trip_id]);

			//
			// With the same set of data (stop_times sequence of stops) we can find out different information.
			// By creating a simplified version of path (just Stop IDs) we can detect different itineraries for the same pattern,
			// and this is used to differentiate pattern versions. The service ID associated with those trips dictactes when
			// this pattern group is valid. The complete path is the one actually saved to the database, since it has full stop details
			// and pickup and dropoff types. To detect trips with the same arrival times at every stop of the path the schedule version is used.
			// These trips are exactly the same, but they have different associated calendars. Depending on the source of the file, or the amount
			// of information associated with each trip, this may be more or less evident. Take the case where the 9h trip happens every day of the year,
			// but there is a need to associate different drivers or vehicles (blocks) to each trip, therefore creating the need to separate each run
			// into multiple trips, each with its own calendar. GTFS motivates this separation to allow for flexibility, but it makes for a lot of duplication.
			// By grouping trips with the same schedules we aim to simplify that consumption. Each trip_id is still available to be matched with
			// GTFS-RT feeds if necessary. Also note that, if the 9h trip is faster in the summer than in the winter, that is also caught here, since all
			// arrival times need to be the same for all stops in the path. Finally, each stop in the path has an associated set of facilities served,
			// a locality and a municipality ID. Instead of running these loops multiple times, we run it once and save all the necessary information immediately.

			const stopTimesAsSimplifiedPath: { stop_id: string, stop_sequence: number }[] = [];
			const stopTimesAsCompletePath: Path = [];

			const stopTimesAsSimplifiedSchedule: { arrival_time: string, stop_id: string, stop_sequence: number }[] = [];
			const stopTimesAsCompleteSchedule: Schedule[] = [];

			const facilitiesList = new Set<string>();
			const locationsList: Location[] = [];

			for (const stopTimeRawData of stopTimesRaw.rows) {
				//

				//
				// Get the stop data associated with the current stop_time

				const stopParsedData = allStopsParsedMap.get(stopTimeRawData.stop_id);
				if (!stopParsedData) continue;

				//
				// Buld the simplified path with only the stop_id and stop_sequence.
				// This will be used to dictacte if this trip belongs to an existing or a new pattern group.

				stopTimesAsSimplifiedPath.push({
					stop_id: stopTimeRawData.stop_id,
					stop_sequence: stopTimeRawData.stop_sequence,
				});

				//
				// Buld the complete path with stop details and service conditions.
				// This will be the path that is stored alongside this pattern group.

				stopTimesAsCompletePath.push({
					allow_drop_off: stopTimeRawData.drop_off_type !== Alight.NOT_AVAILABLE,
					allow_pickup: stopTimeRawData.pickup_type !== Alight.NOT_AVAILABLE,
					distance: Number(stopTimeRawData.shape_dist_traveled),
					distance_delta: 0,
					stop_id: stopTimeRawData.stop_id,
					stop_sequence: stopTimeRawData.stop_sequence,
				});

				//
				// Build the simplified schedule version with only arrival times at each stop.
				// This will be used to merge trips that are equal but happen on differnt dates.

				stopTimesAsSimplifiedSchedule.push({
					arrival_time: stopTimeRawData.arrival_time,
					stop_id: stopTimeRawData.stop_id,
					stop_sequence: stopTimeRawData.stop_sequence,
				});

				//
				// Build the complete schedule, with formatted time strings.
				// This will be the schedule that is stored alongside this trip group.

				stopTimesAsCompleteSchedule.push({
					arrival_time: stopTimeRawData.arrival_time,
					arrival_time_24h: transformOperationTimeStringIntoDisplayTimeString(stopTimeRawData.arrival_time),
					stop_id: stopTimeRawData.stop_id,
					stop_sequence: stopTimeRawData.stop_sequence,
				});

				//
				// Add the facilities served by the current stop to the list

				stopParsedData.facilities.forEach(item => facilitiesList.add(item));

				//
				// Add the current stop location to the list

				locationsList.push(stopParsedData.location);

				//
			}

			//
			// Get the route data associated with this trip from the map

			const routeRawData = allRoutesRawMap.get(tripRawData.route_id);

			//
			// Create the pattern version object with only the fields used to differentiate between each version.
			// A pattern version is differentiated by the fields below, with special focus on direction_id,
			// trip_headsign, shape_id and the simplified version of path (stop_id and stop_sequence).
			// This means that everytime any of these fields differs, a new pattern version will be created,
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

			//
			// Create a hash of the object to detect if this pattern version already exists

			const currentPatternVersionHash = crypto.createHash('sha256').update(JSON.stringify(currentPatternGroup)).digest('hex');

			//
			// Check if this pattern version already exists, and create if it doesn't.
			// The created pattern version will have all the complete information that was not used to differentiate between versions.

			let currentPatternObject: Pattern;

			if (parsedPatternsForThisPatternGroup.has(currentPatternVersionHash)) {
				currentPatternObject = parsedPatternsForThisPatternGroup.get(currentPatternVersionHash);
			}
			else {
				currentPatternObject =	{
					color: routeRawData.route_color ? `#${routeRawData.route_color}` : '#000000',
					direction_id: tripRawData.direction_id,
					facilities: [],
					headsign: tripRawData.trip_headsign,
					line_id: routeRawData.line_id,
					locations: [],
					path: stopTimesAsCompletePath,
					pattern_id: tripRawData.pattern_id,
					pattern_version_id: currentPatternVersionHash,
					route_id: routeRawData.route_id,
					shape_id: tripRawData.shape_id,
					short_name: routeRawData.route_short_name,
					text_color: routeRawData.route_text_color ? `#${routeRawData.route_text_color}` : '#000000',
					trip_groups: [],
					tts_headsign: tts.makePattern(routeRawData.line_id, tripRawData.trip_headsign),
					valid_on: [],
				};
			}

			//
			// Add to the current pattern group (new or exising) the data retrieved from the current trip

			currentPatternObject.valid_on = Array.from(new Set([...allCalendarDatesRawMap.get(tripRawData.service_id), ...currentPatternObject.valid_on]));
			currentPatternObject.facilities = Array.from(new Set([...currentPatternObject.facilities, ...facilitiesList]));

			// Deduplicate locations by checking if the location ID or municipality_id is already present or not
			// This is done to avoid having duplicate locations in the locations array

			currentPatternObject.locations = [...currentPatternObject.locations, ...locationsList].filter((location, index, self) => {
				return index === self.findIndex((loc) => {
					if (location.locality_id) return loc.locality_id === location.locality_id;
					else return loc.municipality_id === location.municipality_id;
				});
			});

			//
			// Create a simplified version of this trip with the goal of finding the same trip,
			// with the same arrival times on all stops, but with different calendars.
			// Notice we're including the pattern group hash since the same trip cannot be present in different
			// pattern groups, as in they are contained in it. In other words, the uniqueness of a trip is dependent
			// on the pattern group it belongs to.

			const simplifiedTripGroup = {
				direction_id: tripRawData.direction_id,
				pattern_id: tripRawData.pattern_id,
				pattern_version_id: currentPatternVersionHash,
				route_id: tripRawData.route_id,
				simplified_schedule: stopTimesAsSimplifiedSchedule,
			};

			//
			// Create a hash of the object to detect if this trip group already exists

			const currentTripGroupHash = crypto.createHash('sha256').update(JSON.stringify(simplifiedTripGroup)).digest('hex');

			//
			// Check if this trip group already exists, and create if it doesn't.
			// The created trip group will have all the complete information not used to differentiate between groups.

			const allTripGroupsForThisPattern = new Map<string, TripGroup>();
			currentPatternObject.trip_groups.forEach(item => allTripGroupsForThisPattern.set(item.trip_group_id, item));

			let currentTripGroupObject: TripGroup;

			if (allTripGroupsForThisPattern.has(currentTripGroupHash)) {
				currentTripGroupObject = allTripGroupsForThisPattern.get(currentTripGroupHash);
			}
			else {
				currentTripGroupObject = {
					schedule: stopTimesAsCompleteSchedule,
					service_ids: [],
					trip_group_id: currentTripGroupHash,
					trip_ids: [],
					valid_on: [],
				};
			}

			//
			// Add to the current trip group (new or exising) the data retrieved from the current trip

			currentTripGroupObject.valid_on = Array.from(new Set([...allCalendarDatesRawMap.get(tripRawData.service_id), ...currentTripGroupObject.valid_on]));
			currentTripGroupObject.service_ids = Array.from(new Set([tripRawData.service_id, ...currentTripGroupObject.service_ids]));
			currentTripGroupObject.trip_ids = Array.from(new Set([tripRawData.trip_id, ...currentTripGroupObject.trip_ids]));

			allTripGroupsForThisPattern.set(currentTripGroupHash, currentTripGroupObject);

			currentPatternObject.trip_groups = Array.from(allTripGroupsForThisPattern.values());

			//
			// Create the route object if it doesn't exist yet. Notice we're not using hashes here
			// because routes are supposed to be unique in the same GTFS file.

			let currentRouteObject: Route;

			if (allRoutesParsed.has(tripRawData.route_id)) {
				currentRouteObject = allRoutesParsed.get(tripRawData.route_id);
			}
			else {
				currentRouteObject = {
					color: routeRawData.route_color ? `#${routeRawData.route_color}` : '#000000',
					facilities: [],
					line_id: routeRawData.line_id,
					locations: [],
					long_name: routeRawData.route_long_name,
					pattern_ids: [],
					route_id: routeRawData.route_id,
					short_name: routeRawData.route_short_name,
					text_color: routeRawData.route_text_color ? `#${routeRawData.route_text_color}` : '#FFFFFF',
					tts_name: tts.makeRoute(routeRawData.line_id, routeRawData.route_long_name),
				};
			}

			//
			// Add to the current route (new or exising) the data retrieved from the current trip

			currentRouteObject.pattern_ids = Array.from(new Set([tripRawData.pattern_id, ...currentRouteObject.pattern_ids]));

			currentRouteObject.facilities = Array.from(new Set([...currentRouteObject.facilities, ...facilitiesList]));

			// Deduplicate locations by checking if the location ID or municipality_id is already present or not
			// This is done to avoid having duplicate locations in the locations array

			currentRouteObject.locations = [...currentRouteObject.locations, ...locationsList].filter((location, index, self) => {
				return index === self.findIndex((loc) => {
					if (location.locality_id) return loc.locality_id === location.locality_id;
					else return loc.municipality_id === location.municipality_id;
				});
			});

			//
			// Create the line object if it doesn't exist yet

			let currentLineObject: Line;

			if (allLinesParsed.has(routeRawData.line_id)) {
				currentLineObject = allLinesParsed.get(routeRawData.line_id);
			}
			else {
				currentLineObject = {
					color: routeRawData.route_color ? `#${routeRawData.route_color}` : '#000000',
					facilities: [],
					line_id: routeRawData.line_id,
					locations: [],
					long_name: routeRawData.line_long_name,
					pattern_ids: [],
					route_ids: [],
					short_name: routeRawData.line_short_name,
					text_color: routeRawData.route_text_color ? `#${routeRawData.route_text_color}` : '#FFFFFF',
					tts_name: tts.makeLine(routeRawData.line_id, routeRawData.line_long_name),
				};
			}

			//
			// Add to the current line (new or exising) the data retrieved from the current trip

			currentLineObject.route_ids = Array.from(new Set([tripRawData.route_id, ...currentLineObject.route_ids]));
			currentLineObject.pattern_ids = Array.from(new Set([tripRawData.pattern_id, ...currentLineObject.pattern_ids]));

			currentLineObject.facilities = Array.from(new Set([...currentLineObject.facilities, ...facilitiesList]));

			// Deduplicate locations by checking if the location ID or municipality_id is already present or not
			// This is done to avoid having duplicate locations in the locations array

			currentLineObject.locations = [...currentLineObject.locations, ...locationsList].filter((location, index, self) => {
				return index === self.findIndex((loc) => {
					if (location.locality_id) return loc.locality_id === location.locality_id;
					else return loc.municipality_id === location.municipality_id;
				});
			});

			//
			// Save the updated objects back to the maps

			allLinesParsed.set(routeRawData.line_id, currentLineObject);
			allRoutesParsed.set(routeRawData.route_id, currentRouteObject);
			parsedPatternsForThisPatternGroup.set(currentPatternVersionHash, currentPatternObject);

			//
		}

		//
		// After going through all the trips for the current pattern, the time comes to save them to the database.
		// However, a small modification is required. The pattern group contains a trips map that should be converted
		// to an array of trips. Also, the pattern groups themselves should be an array for the current pattern ID.

		const finalizedPatternGroupsData: PatternGroup = Array.from(parsedPatternsForThisPatternGroup.values()).map((item: Pattern) => ({ ...item, trip_groups: Object.values(item.trip_groups) }));

		console.log(finalizedPatternGroupsData);

		await SERVERDB.set(SERVERDB_KEYS.NETWORK.PATTERNS.ID(patternId), JSON.stringify(finalizedPatternGroupsData));
		updatedPatternKeys.add(SERVERDB_KEYS.NETWORK.PATTERNS.ID(patternId));

		//
	}

	LOGGER.info(`Updated ${updatedPatternKeys.size} Patterns (${processPatternsTimer.get()})`);

	//
	// Delete stale patterns

	const allPatternKeysInTheDatabase: string[] = [];
	for await (const key of await SERVERDB.scanIterator({ MATCH: `${SERVERDB_KEYS.NETWORK.PATTERNS.BASE}:*`, TYPE: 'string' })) {
		allPatternKeysInTheDatabase.push(key);
	}

	const stalePatternKeys = allPatternKeysInTheDatabase.filter(key => !updatedPatternKeys.has(key));
	if (stalePatternKeys.length) {
		await SERVERDB.del(stalePatternKeys);
	}

	LOGGER.info(`Deleted ${stalePatternKeys.length} stale Patterns`);

	//
	// Save all routes to the database

	const finalizedAllRoutesData: Route[] = (Object.values(allRoutesParsed) as Route[]).sort((a, b) => sortCollator.compare(a.route_id, b.route_id));
	await SERVERDB.set(SERVERDB_KEYS.NETWORK.ROUTES, JSON.stringify(finalizedAllRoutesData));
	LOGGER.info(`Updated ${finalizedAllRoutesData.length} Routes`);

	//
	// Save all lines to the database

	const finalizedAllLinesData: Line[] = (Object.values(allLinesParsed) as Line[]).sort((a, b) => sortCollator.compare(a.line_id, b.line_id));
	await SERVERDB.set(SERVERDB_KEYS.NETWORK.LINES, JSON.stringify(finalizedAllLinesData));
	LOGGER.info(`Updated ${finalizedAllLinesData.length} Lines`);

	//

	LOGGER.success(`Done updating Lines, Routes and Patterns (${globalTimer.get()})`);

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
