/* * */

import type { Timetable } from '@/parsers/timetableExample.js';
import type { GTFSPeriod } from '@/services/NETWORKDB.types.js';

import { formatTime, getElapsedTime } from '@/modules/timeCalc.js';
import NETWORKDB from '@/services/NETWORKDB.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

export default async () => {
	// 1.
	// Record the start time to later calculate operation duration
	const startTime = process.hrtime();

	// Data to be bulk inserted at the end of parsing
	const bulkData: [string, string][] = [];

	// 2.
	// Setup new table with indexes, and remove the last stop of each trip, since we don't want to show them in the timetable
	console.time('Make new table');
	await NETWORKDB.client.query(`
    DROP TABLE IF EXISTS stop_times_without_last_stop;
    CREATE TABLE stop_times_without_last_stop AS
      SELECT *
      FROM stop_times AS st
      WHERE EXISTS (
        SELECT 1
        FROM stop_times AS inner_st
        WHERE inner_st.trip_id = st.trip_id
        AND inner_st.stop_sequence > st.stop_sequence
			);
		CREATE INDEX idx_stop_times_trip_id ON stop_times_without_last_stop (trip_id);
		CREATE INDEX idx_stop_times_stop_id ON stop_times_without_last_stop (stop_id);
		CREATE INDEX idx_stop_times_arrival_time ON stop_times_without_last_stop (arrival_time);
		CREATE INDEX IF NOT EXISTS idx_stop_times_on_trip_id_stop_sequence_arrival_time ON stop_times(trip_id, stop_sequence, arrival_time);
		CREATE INDEX IF NOT EXISTS idx_stop_times_on_stop_id_arrival_time ON stop_times(stop_id, arrival_time);
		CREATE INDEX IF NOT EXISTS idx_trips_on_route_id_service_id_pattern_id ON trips(route_id, service_id, pattern_id);
			`);
	console.timeEnd('Make new table');

	// 3.
	// Get all pairs of line_id and stop_id that exist in trips
	const lineStops = (await NETWORKDB.client.query<{ line_id: string, stop_id: string }>(`
	SELECT DISTINCT stops.stop_id, routes.line_id
	FROM stops
	JOIN stop_times_without_last_STOP AS stop_times ON stops.stop_id = stop_times.stop_id
	JOIN trips ON stop_times.trip_id = trips.trip_id
	JOIN routes ON trips.route_id = routes.route_id
	`)).rows;
	const lineStopPairs = lineStops.map(row => [row.line_id, row.stop_id]);

	// 4. Setup day types and period ids and names
	const dayTypes = new Map<string, 'saturdays' | 'sundays_holidays' | 'weekdays'>([
		['1', 'weekdays'], ['2', 'saturdays'], ['3', 'sundays_holidays'],
	]);
	const periods = new Map((await NETWORKDB.client.query<GTFSPeriod>(`SELECT * FROM periods`)).rows
		.map(period => [
			period.period_id, period.period_name,
		]));

	/**
	 * Add all timetables from this line stop pair to bulkData
	 */
	async function processLineStopPair(LINE_ID: string, STOP_ID: string, index: number | string) {
		console.time(`${index}/${lineStopPairs.length} -> Line ${LINE_ID} stop ${STOP_ID}`);

		// 1. Get all trips on this line that pass through this stop
		const timesByPeriodByDayTypeQuery = `
    SELECT
      periods.period_id,
      calendar_dates.day_type,
      stop_times.arrival_time,
      trips.calendar_desc,
      trips.route_id,
      trips.trip_id,
      trips.direction_id,
      routes.route_long_name,
      trips.pattern_id
    FROM
      stop_times_without_last_stop AS stop_times
      JOIN trips ON stop_times.trip_id = trips.trip_id
      JOIN calendar_dates ON trips.service_id = calendar_dates.service_id
      JOIN periods ON calendar_dates.period = periods.period_id
		JOIN routes ON trips.route_id = routes.route_id
    WHERE
      stop_times.stop_id = $1
      AND trips.pattern_id = ANY(
				SELECT DISTINCT trips.pattern_id
				FROM trips
				JOIN stop_times_without_last_stop AS stop_times ON trips.trip_id = stop_times.trip_id
				JOIN routes ON trips.route_id = routes.route_id
				WHERE stop_times.stop_id = $1 AND routes.line_id = $2
			)
      AND stop_times.arrival_time IS NOT NULL
		`;
		const queryStartTime = process.hrtime.bigint();
		const timesByPeriodByDayTypeResult1 = await NETWORKDB.client.query<{
			arrival_time: string
			calendar_desc: null | string
			day_type: string
			direction_id: number
			pattern_id: string
			period_id: string
			route_id: string
			route_long_name: string
			trip_id: string
		}>(timesByPeriodByDayTypeQuery, [STOP_ID, LINE_ID]);
		if (!timesByPeriodByDayTypeResult1.rows.length) {
			console.log(`⤷ Stop ${STOP_ID} has no times for line ${LINE_ID}.`);
			return;
		}
		const queryDelta = process.hrtime.bigint() - queryStartTime;
		cumulativeQueryTime += queryDelta;

		// 2. Split the results by direction
		// 2.1 Print if there is more than 1 direction
		const directions = new Set<number>(timesByPeriodByDayTypeResult1.rows.map(row => row.direction_id));
		if (directions.size > 1) {
			console.log(`⤷ Stop ${STOP_ID}/${LINE_ID} has more than one direction.`, Array.from(directions));
		}
		// 2.2 Group trips by direction into map
		const timesByPeriodByDayTypeResults = timesByPeriodByDayTypeResult1.rows.reduce((acc, row) => {
			acc[row.direction_id] = acc[row.direction_id] || [];
			acc[row.direction_id].push(row);
			return acc;
		}, {} as Record<number, typeof timesByPeriodByDayTypeResult1.rows>);

		// 2.3 Process each direction
		for (const [DIRECTION_ID, timesByPeriodByDayTypeResult] of Object.entries(timesByPeriodByDayTypeResults)) {
			// 3. Select which variant we will display in the Spine
			// Follows this order of priority, moving to the next if ambiguous or not found:
			// - Base variant, aka ends in 0
			// - Variant with the most trips
			// - Variant with the first route_id, alphabetically
			const variants = new Map<string, string>(timesByPeriodByDayTypeResult.map(row => [
				row.route_id, row.route_long_name,
			]));
			let variantForDisplay = '';
			if (variants.size === 1) {
				variantForDisplay = variants.keys().next().value;
			}
			else {
				for (const [variant, _] of variants) {
					if (variant.endsWith('0')) {
						variantForDisplay = variant;
						break;
					}
				}
			}
			if (variantForDisplay === '') {
				// count how many times each variant appears
				const variantCounts = new Map<string, number>();
				for (const row of timesByPeriodByDayTypeResult) {
					const count = variantCounts.get(row.route_id) || 0;
					variantCounts.set(row.route_id, count + 1);
				}
				// find the variant with the most appearances, else sort them by route_id
				const sortedVariants = Array.from(variantCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
				variantForDisplay = sortedVariants[0][0];
			}
			// Select which trip to use for getting stops, getting a trip that includes the current stop

			// 3.1 Get the pattern_id for the variant we will display
			const patternForDisplay = timesByPeriodByDayTypeResult.find(row => row.route_id === variantForDisplay).pattern_id;
			// Schizo sanity check
			if (!patternForDisplay) {
				console.log(`⤷ No patterns in ${LINE_ID} matching route_id ${variantForDisplay}.`);
				return;
			}

			// Get other patterns for this stop line direction
			const secondaryPatterns = Array.from(new Set(timesByPeriodByDayTypeResult.filter(row => row.pattern_id !== patternForDisplay).map(row => row.pattern_id))).sort();

			// 4. Format exceptions nicely for the timetable
			// 4.1 Get all deduplicated exceptions from GTFS
			const uniqueExceptionsArray = Array.from(new Set(timesByPeriodByDayTypeResult.filter(row => row.calendar_desc != null).map(row => row.calendar_desc)).values());

			// 4.2 Place them in a map
			const exceptions = new Map(uniqueExceptionsArray.map((calendar_desc, index) => {
				return [
					calendar_desc, {
						id: String.fromCharCode(97 + index),
						label: `${String.fromCharCode(97 + index)})`,
						text: calendar_desc,
					},
				];
			}));

			// 4.3 Create exceptions for variants
			const variantExceptions = new Map<string, { id: string, label: string, text: string }>();
			let variantExceptionId = exceptions.size;
			for (const variant of variants) {
				if (variant[0] === variantForDisplay) continue;
				variantExceptions.set(variant[0], {
					id: String.fromCharCode(97 + variantExceptionId),
					label: `${String.fromCharCode(97 + variantExceptionId)})`,
					text: `Percurso ${variant[1]}`,
				});
				variantExceptionId++;
			}

			// 5. Organize the times and exceptions into an actual timetable
			/*
			{
				"1":{
					"weekdays":{
						"05:00":["a","b"],
						"06:00":["a","b"]
					},
					"saturdays":{ ... },
					"sundays_holidays":{ ... }
				},
				"2":{ ... },
			}
			 */
			const timesByPeriodByDayType: Record<string, {
				saturdays: Record<string, string[]>
				sundays_holidays: Record<string, string[]>
				weekdays: Record<string, string[]>
			}> = {};

			// Init map with all periods
			for (const period_id of periods.keys()) {
				timesByPeriodByDayType[period_id] = {
					saturdays: {},
					sundays_holidays: {},
					weekdays: {},
				};
			}

			timesByPeriodByDayTypeResult.forEach((row) => {
				const { arrival_time, calendar_desc, day_type, period_id } = row;
				const dt = dayTypes.get(day_type);
				const variantException = variantExceptions.get(row.route_id);
				const calendar_descId = calendar_desc ? exceptions.get(calendar_desc)?.id : null;

				if (!timesByPeriodByDayType[period_id][dt]) {
					timesByPeriodByDayType[period_id][dt] = {};
				}

				if (!timesByPeriodByDayType[period_id][dt][arrival_time]) {
					timesByPeriodByDayType[period_id][dt][arrival_time] = [
					];
				}

				if (calendar_descId) {
					timesByPeriodByDayType[period_id][dt][arrival_time].push(calendar_descId);
				}

				if (variantException) {
					timesByPeriodByDayType[period_id][dt][arrival_time].push(variantException.id);
				}
			});

			// 6. Merge exceptions and variant exceptions
			const mappedExceptions = new Map(Array.from(exceptions).map(([
				_, exception,
			]) => [exception.id, exception]));

			const mappedVariantExceptions = new Map(Array.from(variantExceptions).map(([
				_, exception,
			]) => [exception.id, exception]));

			const mergedExceptions = new Map<string, { id: string, label: string, text: string }>([
				...mappedExceptions, ...mappedVariantExceptions,
			]);
			// console.log('mergedExceptions', mergedExceptions);

			// 7. Build the timetable object
			const timetable: Timetable = {
				exceptions: Array.from(mergedExceptions.values()),
				// Set patterns for both Spine and header with other patterns
				patternForDisplay,
				// For each period, build the timetable
				periods: Object.entries(timesByPeriodByDayType).map(([period_id, dayTypes]) => {
					const getPeriod = (time: string, _exceptions: string[]) => ({
						// deduplicate exceptions
						exceptions: _exceptions.reduce((acc, ex) => acc.includes(ex) ? acc : acc.concat(ex), [
						] as string[])
							.map((ex) => {
								const exp = mergedExceptions.get(ex);
								return { id: exp.id };
							}),
						time,
					});

					return {
						period_id,
						period_name: periods.get(period_id),

						saturdays: Object.entries(dayTypes.saturdays)
							.map(([time, exceptions]) => getPeriod(time, exceptions)),

						sundays_holidays: Object.entries(dayTypes.sundays_holidays)
							.map(([time, exceptions]) => getPeriod(time, exceptions)),

						weekdays: Object.entries(dayTypes.weekdays)
							.map(([time, exceptions]) => getPeriod(time, exceptions)),
					};
				}),
				secondaryPatterns,
			};
			// Add this to bulkData
			bulkData.push([
				`${LINE_ID}/${DIRECTION_ID}/${STOP_ID}`, JSON.stringify(timetable),
			]);
		}
		// Log how long this line + stop took for all directions
		console.timeEnd(`${index}/${lineStopPairs.length} -> Line ${LINE_ID} stop ${STOP_ID}`);
	}

	/**
   *
   */
	// const tasks = lineStopPairs.slice(0, 10000).map((pair, index) => {
	// 	const [LINE_ID, STOP_ID] = pair;
	// 	return () => processLineStopPair(LINE_ID, STOP_ID, index);
	// });
	// await limitConcurrency(tasks, 2);

	// Setup time tracking
	let cumulativeQueryTime = BigInt(0);
	const allLineStartTime = process.hrtime.bigint();
	/**
   *
   * 37s for 1000
   * 1m 39s for 10000
   */
	for (const index in lineStopPairs) {
		const [
			LINE_ID, STOP_ID,
		] = lineStopPairs[index];
		await processLineStopPair(LINE_ID, STOP_ID, index);
	}

	const allLineTime = process.hrtime.bigint() - allLineStartTime;
	// Log how much time was spent on queries
	console.log(`Spent ${formatTime(cumulativeQueryTime)} on ${lineStops.length} queries`);
	// Log how much time was spent in javascript
	console.log(`Spent ${formatTime(allLineTime - cumulativeQueryTime)} on other stuff`);

	// Bulk set all timetables, this is much faster than one at a time
	console.time('⤷ Timetable mset');
	await SERVERDB.client.mSet(bulkData.flatMap(([key, value]) => [
		`timetables:${key}`, value,
	]));
	console.timeEnd('⤷ Timetable mset');

	// Update index
	const index = {
		pairs: bulkData.map(([key, _]) => key),
		updated_at: (new Date()).toISOString(),
	};
	await SERVERDB.client.set('timetables:index', JSON.stringify(index));

	// 9.
	// Log elapsed time parsing timetables
	const elapsedTime = getElapsedTime(startTime);
	console.log(`⤷ Done updating Timetables (${elapsedTime}).`);

	//
};
