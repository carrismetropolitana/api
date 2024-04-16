/* * */

import sortCollator from '../modules/sortCollator';
import { formatTime, getElapsedTime } from '../modules/timeCalc';
import { connection } from '../services/NETWORKDB';
import { client } from '../services/SERVERDB';
import { Timetable, TimetableStop } from './timetableExample';

/* * */

export default async () => {
	// 1.
	// Record the start time to later calculate operation duration
	const startTime = process.hrtime();

	const bulkData = [];
	console.time('Make new table');
	await connection.query(`
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
	// 2.
	// Fetch all Periods from Redis
	const lineStops = (await connection.query<{stop_id:string, line_id:string}>(`
	SELECT DISTINCT stops.stop_id, routes.line_id
	FROM stops
	JOIN stop_times_without_last_STOP AS stop_times ON stops.stop_id = stop_times.stop_id 
	JOIN trips ON stop_times.trip_id = trips.trip_id
	JOIN routes ON trips.route_id = routes.route_id
	`)).rows;
	// console.log('lineStops', lineStops.rows);
	const lineStopPairs = lineStops.map(row => [row.line_id, row.stop_id]);
	const dayTypes = new Map<string, 'weekdays' | 'saturdays' | 'sundays_holidays'>([['1', 'weekdays'], ['2', 'saturdays'], ['3', 'sundays_holidays']]);
	const periods = new Map((await connection.query<GTFSPeriod>(`SELECT * FROM periods`)).rows
		.map(period => [period.period_id, period.period_name]));

	let cumulativeQueryTime = 0n;
	const allLineStartTime = process.hrtime.bigint();
	let i = 0;
	for (const [LINE_ID, STOP_ID] of lineStopPairs) {
		console.time(`${i}/${lineStopPairs.length} -> Line ${LINE_ID} stop ${STOP_ID}`);

		const timesByPeriodByDayTypeQuery = `
    SELECT
      periods.period_id,
      calendar_dates.day_type,
      stop_times.arrival_time,
      trips.calendar_desc,
			trips.route_id,
			trips.trip_id,
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
		// console.time('timesByPeriodByDayType query');
		const timesByPeriodByDayTypeResult = await connection.query<{
			period_id: string,
			day_type: string,
			arrival_time: string,
			calendar_desc: null | string,
			route_id: string,
			trip_id: string,
			route_long_name: string,
			pattern_id: string
		}>(timesByPeriodByDayTypeQuery, [STOP_ID, LINE_ID]);
		if (!timesByPeriodByDayTypeResult.rows.length) {
			console.log(`⤷ Stop ${STOP_ID} has no times for line ${LINE_ID}.`);
			continue;
		}
		const queryDelta = process.hrtime.bigint() - queryStartTime;
		cumulativeQueryTime += queryDelta;
		const variants = new Map<string, string>(timesByPeriodByDayTypeResult.rows.map(row => [row.route_id, row.route_long_name]));
		let variantForDisplay = '';
		if (variants.size == 1) {
			variantForDisplay = variants.keys().next().value;
		} else {
			for (const [variant, route] of variants) {
				if (variant.endsWith('0')) {
					variantForDisplay = variant;
					break;
				}
			}
		}
		if (variantForDisplay === '') {
			// count how many times each variant appears
			const variantCounts = new Map<string, number>;
			for (const row of timesByPeriodByDayTypeResult.rows) {
				const count = variantCounts.get(row.route_id) || 0;
				variantCounts.set(row.route_id, count + 1);
			}
			// find the variant with the most appearances, else sort them by route_id
			const sortedVariants = Array.from(variantCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
			variantForDisplay = sortedVariants[0][0];
		}
		// Select which trip to use for getting stops, getting a trip that includes the current stop

		const patternForDisplay = timesByPeriodByDayTypeResult.rows.find(row => row.route_id == variantForDisplay).pattern_id;
		if (!patternForDisplay) {
			console.log(`⤷ No patterns in ${LINE_ID} matching route_id ${variantForDisplay}.`);
			continue;
		}

		const tripForStopsQuery = `
		SELECT
			trips.trip_id
		FROM
			trips
			JOIN stop_times ON trips.trip_id = stop_times.trip_id
		WHERE
			trips.route_id = $1
			AND stop_times.stop_id = $2
		LIMIT 1`;

		const tripForStopsResult = await connection.query<{ trip_id: string }>(tripForStopsQuery, [variantForDisplay, STOP_ID]);
		// if (tripForStopsResult.rows[0].trip_id != tripForStops) {
		// 	console.log(`${tripForStopsResult.rows[0].trip_id} != ${tripForStops}`);
		// 	continue;
		// }
		if (tripForStopsResult.rows.length <= 0) {
			console.log(`⤷ Stop ${STOP_ID} has no trip for line ${variantForDisplay}.`);
			continue;
		}

		const uniqueExceptionsArray = Array.from(new Set(timesByPeriodByDayTypeResult.rows.filter(row => row.calendar_desc != null).map(row => row.calendar_desc)).values());
		const exceptions = new Map(uniqueExceptionsArray.map((calendar_desc, index) => {
			return [calendar_desc, {
				id: String.fromCharCode(97 + index),
				label: String.fromCharCode(97 + index) + ')',
				text: calendar_desc,
			}];
		}));

		// console.log('variants', variants);
		const variantExceptions = new Map<string, { label: string, text: string, id: string }>;

		let variantExceptionId = exceptions.size;
		if (variants.size > 1) {
			// console.log(`⤷ Stop ${STOP_ID} has more than one variant.`, Array.from(variants));
			for (const variant of variants) {
				if (variant[0].endsWith('0')) continue;
				variantExceptions.set(variant[0], {
					id: String.fromCharCode(97 + variantExceptionId),
					label: String.fromCharCode(97 + variantExceptionId) + ')',
					text: 'Percurso ' + variant[1],
				});
				variantExceptionId++;
			}
		}

		const timesByPeriodByDayType: {
			[period: string]: {
				weekdays?: {
					[time: string]: string[]
				},
				saturdays?: {
					[time: string]: string[]
				},
				sundays_holidays?: {
					[time: string]: string[]
				}
			}
		} = {};
		for (const period_id of periods.keys()) {
			timesByPeriodByDayType[period_id] = {};
		}

		timesByPeriodByDayTypeResult.rows.forEach(row => {
			const { period_id, day_type, arrival_time, calendar_desc } = row;
			const dt = dayTypes.get(day_type);
			const variantException = variantExceptions.get(row.route_id);
			const calendar_descId = calendar_desc ? exceptions.get(calendar_desc)?.id : null;

			if (!timesByPeriodByDayType[period_id]) {
				timesByPeriodByDayType[period_id] = {};
			}
			if (!timesByPeriodByDayType[period_id][dt]) {
				timesByPeriodByDayType[period_id][dt] = {};
			}
			if (!timesByPeriodByDayType[period_id][dt][arrival_time]) {
				timesByPeriodByDayType[period_id][dt][arrival_time] = [];
			}
			if (calendar_descId) {
				timesByPeriodByDayType[period_id][dt][arrival_time].push(calendar_descId);
			}
			if (variantException) {
				timesByPeriodByDayType[period_id][dt][arrival_time].push(variantException.id);
			}
		});
		// console.log('timesByPeriodByDayType', JSON.stringify(timesByPeriodByDayType, null, 2));

		const mappedVariantExceptions = new Map(Array.from(variantExceptions).map(([_, exception]) => [exception.id, exception]));
		const mappedExceptions = new Map(Array.from(exceptions).map(([_, exception]) => [exception.id, exception]));
		const mergedExceptions: Map<string, { id: string, label: string, text: string }> = new Map([...mappedExceptions, ...mappedVariantExceptions]);
		// console.log('mergedExceptions', mergedExceptions);

		const timetable: Timetable = {
			periods: Object.entries(timesByPeriodByDayType).map(([period_id, dayTypes]) => {
				const getPeriod = (time: string, _exceptions: string[]) => ({
					time,
					// deduplicate exceptions
					exceptions: _exceptions.reduce((acc, ex) => acc.includes(ex) ? acc : acc.concat(ex), [] as string[])
						.map(ex => {
							const exp = mergedExceptions.get(ex);
							return { id: exp.id };
						}),
				});

				return {
					period_id: period_id,
					period_name: periods.get(period_id),
					weekdays: dayTypes.weekdays ? Object.entries(dayTypes.weekdays).map(([time, exceptions]) => getPeriod(time, exceptions)) : [],
					saturdays: dayTypes.saturdays ? Object.entries(dayTypes.saturdays).map(([time, exceptions]) => getPeriod(time, exceptions)) : [],
					sundays_holidays: dayTypes.sundays_holidays ? Object.entries(dayTypes.sundays_holidays).map(([time, exceptions]) => getPeriod(time, exceptions)) : [],
				};
			}),
			exceptions: Array.from(mergedExceptions.values()),
			patternForDisplay: patternForDisplay,
		};
		bulkData.push([`timetables:${LINE_ID}/${STOP_ID}`, JSON.stringify(timetable)]);
		console.timeEnd(`${i++}/${lineStopPairs.length} -> Line ${LINE_ID} stop ${STOP_ID}`);
		if (timetable.periods.length != 3) {
			console.log(`⤷ Stop ${STOP_ID} has only ${timetable.periods.length} periods.`);
			console.log(JSON.stringify(timetable, null, 2), JSON.stringify(timesByPeriodByDayType, null, 2));
			return;
		}
	}
	const allLineTime = process.hrtime.bigint() - allLineStartTime;
	console.log(`Spent ${formatTime(cumulativeQueryTime)} on ${lineStops.length} queries`);
	// and now for the rest of the time
	console.log(`Spent ${formatTime(allLineTime - cumulativeQueryTime)} on other stuff`);
	console.time('⤷ Timetable mset');
	await client.mSet(bulkData);
	console.timeEnd('⤷ Timetable mset');
	const index = {
		updated_at: (new Date).toISOString(),
		pairs: lineStopPairs,
	};
	await client.set('timetables:index', JSON.stringify(index));

	// 9.
	// Log elapsed time in the current operation
	const elapsedTime = getElapsedTime(startTime);
	console.log(`⤷ Done updating Timetables (${elapsedTime}).`);

	//
};