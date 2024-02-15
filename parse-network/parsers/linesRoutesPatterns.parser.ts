/* * */

import { connection } from '../services/NETWORKDB';
import { client } from '../services/SERVERDB';
import { getElapsedTime } from '../modules/timeCalc';
import collator from '../modules/sortCollator';
import { MonStop } from '../services/NETWORKDB.types';

/* * */

function calculateTimeDifference(time1: string, time2: string): string {
	// Handle the case where time1 is zero
	if (time1 === '00:00:00') return '00:00:00';
	// Convert time strings to seconds
	const [h1, m1, s1] = time1.split(':').map(Number);
	const [h2, m2, s2] = time2.split(':').map(Number);
	let totalSeconds1 = h1 * 3600 + m1 * 60 + s1;
	let totalSeconds2 = h2 * 3600 + m2 * 60 + s2;

	// Take modulus of total seconds to handle cases exceeding 24 hours
	totalSeconds1 %= 86400;
	totalSeconds2 %= 86400;

	// Calculate time difference
	let timeDifference = totalSeconds2 - totalSeconds1;

	// Handle negative time difference
	if (timeDifference < 0) {
		timeDifference += 86400;
	}

	// Convert time difference back to "HH:MM:SS" format
	const hours = Math.floor(timeDifference / 3600);
	const minutes = Math.floor((timeDifference % 3600) / 60);
	const seconds = timeDifference % 60;

	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

//
//
//

function formatArrivalTime(arrival_time: string) {
	const arrival_time_array = arrival_time.split(':');
	let arrival_time_hours = arrival_time_array[0].padStart(2, '0');
	if (arrival_time_hours && Number(arrival_time_hours) > 23) {
		const arrival_time_hours_adjusted = Number(arrival_time_hours) - 24;
		arrival_time_hours = String(arrival_time_hours_adjusted).padStart(2, '0');
	}
	const arrival_time_minutes = arrival_time_array[1].padStart(2, '0');
	const arrival_time_seconds = arrival_time_array[2].padStart(2, '0');
	// Return formatted string
	return `${arrival_time_hours}:${arrival_time_minutes}:${arrival_time_seconds}`;
}

//
//
//

/**
 * UPDATE LINES AND PATTERNS
 * Query 'routes' table to get all unique routes.
 * Save each result in MongoDB.
 * @async
 */
export default async () => {
	//

	// 1.
	// Record the start time to later calculate operation duration
	const startTime_global = process.hrtime();

	// 3.
	// Get all stops and build a hashmap for quick retrieval
	const allStopsTxt = await client.get('stops:all');
	const allStopsJson: MonStop[] = JSON.parse(allStopsTxt);
	const allStopsHashmap = new Map(allStopsJson.map(obj => [obj.id, obj]));

	// 4.
	// Query Postgres for all calendar dates and build a hashmap for quick retrieval
	const allDatesRaw = await connection.query<GTFSCalendarDate>(`SELECT * FROM calendar_dates`);
	const allDatesHashmap = new Map;
	const allCalendarDatesHashmap = new Map;
	for (const row of allDatesRaw.rows) {
		// Build a hashmap for dates, periods and day_types
		if (!allDatesHashmap.has(row.date)) allDatesHashmap.set(row.date, { period: row.period, day_type: row.day_type });
		// Build a hashmap for calendar dates
		if (allCalendarDatesHashmap.has(row.service_id)) allCalendarDatesHashmap.get(row.service_id).push(row.date);
		else allCalendarDatesHashmap.set(row.service_id, [row.date]);
	}

	// 5,
	// Query Postgres for all unique routes
	console.log(`⤷ Querying database...`);
	const allRoutesRaw = await connection.query<GTFSRoute>('SELECT * FROM routes');

	// 6.
	// Group all routes into lines by route_short_name
	const allLinesRaw = allRoutesRaw.rows.reduce((result, route) => {
		//
		// 7.1.
		// Check if the route_short_name already exists as a line
		const existingLine = result.find(line => line.short_name === route.route_short_name);

		// 7.2.
		// Add the route to the existing line or create a new line with the route
		if (existingLine) {
			existingLine.routes.push(route);
		} else {
			result.push({
				id: route.route_short_name,
				short_name: route.route_short_name,
				long_name: route.route_long_name,
				color: route.route_color,
				text_color: route.route_text_color,
				routes: [route],
			});
		}

		// 7.3.
		// Return result for the next iteration
		return result;

		//
	}, []);

	// 7.
	// Initiate variables to hold all lines and routes
	const allLinesFinal = [];
	const allRoutesFinal = [];

	// 8.
	// Initiate variables to keep track of updated _ids
	const updatedLineKeys = new Set;
	const updatedRouteKeys = new Set;
	const updatedPatternKeys = new Set;

	// 9.
	// For all trips of all routes of each line,
	// group trips into unique patterns by their common 'pattern_id'.
	for (const lineRaw of allLinesRaw) {
		//
		// 9.1.
		// Record the start time to later calculate operation duration
		const startTime_line = process.hrtime();

		// 9.2.
		// Initiate other holding variables
		const linePassesByMunicipalities = new Set;
		const linePassesByLocalities = new Set;
		const linePassesByFacilities = new Set;

		// 9.4.
		// Build parsed line object
		const lineParsed = {
			//
			id: lineRaw.id,
			//
			short_name: lineRaw.short_name,
			long_name: lineRaw.long_name,
			color: lineRaw.color ? `#${lineRaw.color}` : '#000000',
			text_color: lineRaw.text_color ? `#${lineRaw.text_color}` : '#FFFFFF',
			//
			routes: [],
			patterns: [],
			//
			municipalities: [],
			localities: [],
			facilities: [],
			//
		};

		// 9.4.
		// Iterate on each route for this line
		for (const routeRaw of lineRaw.routes) {
			//
			// 9.4.1.
			// Initiate a variable to hold parsed patterns
			const parsedPatternsForThisRoute = [];

			// 9.4.2.
			// Initiate other holding variables
			const routePassesByMunicipalities = new Set;
			const routePassesByLocalities = new Set;
			const routePassesByFacilities = new Set;

			// 9.4.5.
			// Build parsed route object
			const routeParsed = {
				//
				id: routeRaw.route_id,
				//
				line_id: lineParsed.id,
				//
				short_name: routeRaw.route_short_name,
				long_name: routeRaw.route_long_name,
				color: lineParsed.color,
				text_color: lineParsed.text_color,
				//
				patterns: [],
				//
				municipalities: [],
				localities: [],
				facilities: [],
				//
			};

			// 9.4.3.
			// Get all trips associated with this route
			const allTripsRaw = await connection.query<GTFSTrip>(`SELECT * FROM trips WHERE route_id = $1`, [routeRaw.route_id]);

			// 9.4.4.
			// Reduce all trips into unique patterns. Do this for all routes of the current line.
			// Patterns are combined by the unique combination of 'pattern_id', 'direction_id', 'trip_headsign' and 'shape_id'.
			for (const tripRaw of allTripsRaw.rows) {
				//

				// 9.4.4.1.
				// Find the pattern that matches the unique combination for this trip
				const patternParsed = parsedPatternsForThisRoute.find(pattern => pattern.id === tripRaw.pattern_id);

				// 9.4.4.2.
				// Get the current trip stop_times
				const allStopTimesRaw = await connection.query<GTFSStopTime>(`SELECT * FROM stop_times WHERE trip_id = '${tripRaw.trip_id}' ORDER BY stop_sequence`);

				// 9.4.4.3.
				// Initiate temporary holding variables
				const formattedPath = [];
				const formattedSchedule = [];

				let prevTravelDistance = 0;
				let prevArrivalTime = '00:00:00';

				const patternPassesByMunicipalities = new Set;
				const patternPassesByLocalities = new Set;
				const patternPassesByFacilities = new Set;

				// 9.4.4.4.
				// For each path sequence
				for (const stopTimeRaw of allStopTimesRaw.rows) {
					//
					// 9.4.4.4.1.
					// Get existing stop document from database
					const existingStopDocument = allStopsHashmap.get(stopTimeRaw.stop_id);

					// 9.4.4.4.2.
					// Calculate distance delta and update variable
					const currentDistanceDelta = Number(stopTimeRaw.shape_dist_traveled) - prevTravelDistance;
					prevTravelDistance = Number(stopTimeRaw.shape_dist_traveled);

					// 9.4.4.4.3.
					// Format arrival_time
					const arrivalTimeFormatted = formatArrivalTime(stopTimeRaw.arrival_time);

					// 9.4.4.4.4.
					// Calculate travel time
					const currentTravelTime = calculateTimeDifference(prevArrivalTime, stopTimeRaw.arrival_time);
					prevArrivalTime = stopTimeRaw.arrival_time;

					// 9.4.4.4.5.
					// Save formatted stop_time to path if no pattern with the unique combination exists yet
					if (!patternParsed) {
						formattedPath.push({
							Stop: existingStopDocument,
							stop_sequence: stopTimeRaw.stop_sequence,
							allow_pickup: stopTimeRaw.pickup_type ? false : true,
							allow_drop_off: stopTimeRaw.drop_off_type ? false : true,
							distance_delta: currentDistanceDelta,
						});
					}

					// 9.4.4.4.6.
					// Save formatted stop_time to schedule
					formattedSchedule.push({
						stop_id: existingStopDocument.id,
						stop_sequence: stopTimeRaw.stop_sequence,
						arrival_time: arrivalTimeFormatted,
						arrival_time_operation: stopTimeRaw.arrival_time,
						travel_time: currentTravelTime,
					});

					// 9.4.4.4.7.
					// Associate the current stop municipality to the current line, route and pattern
					linePassesByMunicipalities.add(existingStopDocument.municipality_id);
					routePassesByMunicipalities.add(existingStopDocument.municipality_id);
					patternPassesByMunicipalities.add(existingStopDocument.municipality_id);

					// 9.4.4.4.8.
					// Associate the current stop locality to the current line, route and pattern
					linePassesByLocalities.add(existingStopDocument.locality);
					routePassesByLocalities.add(existingStopDocument.locality);
					patternPassesByLocalities.add(existingStopDocument.locality);

					// 9.4.4.4.9. (TBD)
					// Associate the current stop facility to the current line, route and pattern
					//   linePassesByFacilities.add(existingStopDocument.locality);
					//   routePassesByFacilities.add(existingStopDocument.locality);
					//   patternPassesByFacilities.add(existingStopDocument.locality);

					//
				}

				// 9.4.4.5.
				// Get dates in the YYYYMMDD format (GTFS Standard format)
				const tripDates = allCalendarDatesHashmap.get(tripRaw.service_id);

				// 9.4.4.6.
				// Create a new formatted trip object
				const tripParsed = {
					id: tripRaw.trip_id,
					calendar_id: tripRaw.service_id,
					calendar_description: tripRaw.calendar_desc || '',
					dates: tripDates,
					schedule: formattedSchedule,
				};

				// 9.4.4.7.
				// If there is already a pattern matching the unique combination of trip values,
				// then update it with the current formatted trip and new valid_on dates
				// and skip to the next iteration.
				if (patternParsed) {
					patternParsed.valid_on = [...new Set([...patternParsed.valid_on, ...tripDates])];
					patternParsed.trips.push(tripParsed);
					continue;
				}

				// 9.4.4.8.
				// If no pattern was found matching the unique combination,
				// then create a new one with the formatted path and formatted trip values.
				parsedPatternsForThisRoute.push({
					//
					id: tripRaw.pattern_id,
					//
					line_id: lineParsed.id,
					route_id: routeRaw.route_id,
					//
					short_name: lineParsed.short_name,
					direction: tripRaw.direction_id,
					headsign: tripRaw.trip_headsign,
					//
					color: lineParsed.color,
					text_color: lineParsed.text_color,
					//
					valid_on: tripDates,
					//
					municipalities: Array.from(patternPassesByMunicipalities),
					localities: Array.from(patternPassesByLocalities),
					facilities: Array.from(patternPassesByFacilities),
					//
					shape_id: tripRaw.shape_id,
					//
					path: formattedPath,
					//
					trips: [tripParsed],
					//
				});

				//
			}

			// 9.4.6.
			// Save all created patterns to the database and update parent route and line
			for (const patternParsed of parsedPatternsForThisRoute) {
				await client.set(`patterns:${patternParsed.id}`, JSON.stringify(patternParsed));
				updatedPatternKeys.add(`patterns:${patternParsed.id}`);
				routeParsed.patterns.push(patternParsed.id);
				lineParsed.patterns.push(patternParsed.id);
			}

			// 9.4.7.
			// Update the current route with the associated municipalities and facilities
			routeParsed.municipalities = Array.from(routePassesByMunicipalities);
			routeParsed.localities = Array.from(routePassesByLocalities);
			routeParsed.facilities = Array.from(routePassesByFacilities);

			// 9.4.8.
			// Add the current route to the routes:all REDIS key
			allRoutesFinal.push(routeParsed);

			// 9.4.9.
			// Update the current line with the current route id
			lineParsed.routes.push(routeParsed.id);

			// 9.4.10.
			// Save the current route to the database
			await client.set(`routes:${routeParsed.id}`, JSON.stringify(routeParsed));
			updatedRouteKeys.add(`routes:${routeParsed.id}`);

			//
		}

		// 9.5.
		// Update the current line with the associated municipalities and facilities
		lineParsed.municipalities = Array.from(linePassesByMunicipalities);
		lineParsed.localities = Array.from(linePassesByLocalities);
		lineParsed.facilities = Array.from(linePassesByFacilities);

		// 9.6.
		// Add the current line to the lines:all REDIS key
		allLinesFinal.push(lineParsed);

		// 9.7.
		// Save the current line to the database
		await client.set(`lines:${lineParsed.id}`, JSON.stringify(lineParsed));
		updatedLineKeys.add(`lines:${lineParsed.id}`);

		// 9.8.
		// Log operation details and elapsed time
		const elapsedTime_line = getElapsedTime(startTime_line);
		console.log(`⤷ Updated Line ${lineParsed.id} | ${lineParsed.routes.length} Routes | ${lineParsed.patterns.length} Patterns | ${elapsedTime_line}.`);

		//
	}

	// 10.
	// Save all routes to the routes:all REDIS key
	allRoutesFinal.sort((a, b) => collator.compare(a.id, b.id));
	await client.set('routes:all', JSON.stringify(allRoutesFinal));
	updatedRouteKeys.add('routes:all');

	// 11.
	// Save all lines to the lines:all REDIS key
	allLinesFinal.sort((a, b) => collator.compare(a.id, b.id));
	await client.set('lines:all', JSON.stringify(allLinesFinal));
	updatedLineKeys.add('lines:all');

	// 12.
	// Delete stale patterns not present in the current update
	const allPatternKeysInTheDatabase = [];
	for await (const key of client.scanIterator({ TYPE: 'string', MATCH: 'patterns:*' })) {
		allPatternKeysInTheDatabase.push(key);
	}
	const stalePatternKeys = allPatternKeysInTheDatabase.filter(key => !updatedPatternKeys.has(key));
	if (stalePatternKeys.length) await client.del(stalePatternKeys);
	console.log(`⤷ Deleted ${stalePatternKeys.length} stale Patterns.`);

	// 13.
	// Delete stale routes not present in the current update
	const allRouteKeysInTheDatabase = [];
	for await (const key of client.scanIterator({ TYPE: 'string', MATCH: 'routes:*' })) {
		allRouteKeysInTheDatabase.push(key);
	}
	const staleRouteKeys = allRouteKeysInTheDatabase.filter(key => !updatedRouteKeys.has(key));
	if (staleRouteKeys.length) await client.del(staleRouteKeys);
	console.log(`⤷ Deleted ${staleRouteKeys.length} stale Routes.`);

	// 14.
	// Delete stale lines not present in the current update
	const allLineKeysInTheDatabase = [];
	for await (const key of client.scanIterator({ TYPE: 'string', MATCH: 'lines:*' })) {
		allLineKeysInTheDatabase.push(key);
	}
	const staleLineKeys = allLineKeysInTheDatabase.filter(key => !updatedLineKeys.has(key));
	if (staleLineKeys.length) await client.del(staleLineKeys);
	console.log(`⤷ Deleted ${staleLineKeys.length} stale Lines.`);

	// 15.
	// Log elapsed time in the current operation
	const elapsedTime_global = getElapsedTime(startTime_global);
	console.log(`⤷ Done! Updated ${updatedLineKeys.size} Lines | ${updatedRouteKeys.size} Routes | ${updatedPatternKeys.size} Patterns | ${elapsedTime_global}`);

	//
};