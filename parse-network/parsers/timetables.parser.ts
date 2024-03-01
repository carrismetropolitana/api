/* * */

import sortCollator from '../modules/sortCollator';
import { formatTime, getElapsedTime } from '../modules/timeCalc';
import { connection } from '../services/NETWORKDB';
import { client } from '../services/SERVERDB';
import { Facility, Timetable, TimetableStop } from './timetableExample';

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
		let variantForLineStops = '';
		if (variants.size == 1) {
			variantForLineStops = variants.keys().next().value;
		} else {
			for (const [variant, route] of variants) {
				if (variant.endsWith('0')) {
					variantForLineStops = variant;
					break;
				}
			}
		}
		if (variantForLineStops === '') {
			// count how many times each variant appears
			const variantCounts = new Map<string, number>;
			for (const row of timesByPeriodByDayTypeResult.rows) {
				const count = variantCounts.get(row.route_id) || 0;
				variantCounts.set(row.route_id, count + 1);
			}
			// find the variant with the most appearances, else sort them by route_id
			const sortedVariants = Array.from(variantCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
			variantForLineStops = sortedVariants[0][0];
		}
		// Select which trip to use for getting stops, getting a trip that includes the current stop
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

		const tripForStopsResult = await connection.query<{ trip_id: string }>(tripForStopsQuery, [variantForLineStops, STOP_ID]);
		// if (tripForStopsResult.rows[0].trip_id != tripForStops) {
		// 	console.log(`${tripForStopsResult.rows[0].trip_id} != ${tripForStops}`);
		// 	continue;
		// }

		const lineStopsByTripIdQuery = `
		SELECT
			stop_times.stop_id,
			stop_times.stop_sequence,
			stops.stop_short_name,
			stops.stop_name,
			stops.locality,
			stops.municipality_name,
			stops.near_health_clinic,
			stops.near_hospital,
			stops.near_university,
			stops.near_school,
			stops.near_police_station,
			stops.near_fire_station,
			stops.near_shopping,
			stops.near_historic_building,
			stops.near_transit_office,
			stops.light_rail,
			stops.subway,
			stops.train,
			stops.boat,
			stops.airport,
			stops.bike_sharing,
			stops.bike_parking,
			stops.car_parking
		FROM
			stop_times
			JOIN stops ON stop_times.stop_id = stops.stop_id
		WHERE
			stop_times.trip_id = $1
		ORDER BY
			stop_times.stop_sequence
		`;

		const lineStopsByTripIdResult = await connection.query<
		{
				stop_id: string,
				stop_sequence: number,
				stop_short_name: string,
				stop_name: string,
				locality: string,
				municipality_name: string,
				near_health_clinic: boolean,
				near_hospital: boolean,
				near_university: boolean,
				near_school: boolean,
				near_police_station: boolean,
				near_fire_station: boolean,
				near_shopping: boolean,
				near_historic_building: boolean,
				near_transit_office: boolean,
				light_rail: boolean,
				subway: boolean,
				train: boolean,
				boat: boolean,
				airport: boolean,
				bike_sharing: boolean,
				bike_parking: boolean,
				car_parking: boolean
			}>(lineStopsByTripIdQuery, [tripForStopsResult.rows[0].trip_id]);
		// console.log('lineStopsByTripIdResult', lineStopsByTripIdResult.rows);
		// group by trip_id and sort by stop_sequence
		if (lineStopsByTripIdResult.rows.length <= 0) {
			console.log(`⤷ Stop ${STOP_ID} has no stops for line ${tripForStopsResult}.`);
			continue;
		}
		const joinedProperties:Facility[] = [
			Facility.NEAR_HEALTH_CLINIC,
			Facility.NEAR_HOSPITAL,
			Facility.NEAR_UNIVERSITY,
			Facility.NEAR_SCHOOL,
			Facility.NEAR_POLICE_STATION,
			Facility.NEAR_FIRE_STATION,
			Facility.NEAR_SHOPPING,
			Facility.NEAR_HISTORIC_BUILDING,
			Facility.NEAR_TRANSIT_OFFICE,
			Facility.LIGHT_RAIL,
			Facility.SUBWAY,
			Facility.TRAIN,
			Facility.BOAT,
			Facility.AIRPORT,
			Facility.BIKE_SHARING,
			Facility.BIKE_PARKING,
			Facility.CAR_PARKING,
		];
		const stops:TimetableStop[] =
		[];
		for (const row of lineStopsByTripIdResult.rows) {
			const newRow = {
				stop_id: row.stop_id,
				stop_sequence: row.stop_sequence,
				stop_short_name: row.stop_short_name,
				stop_name: row.stop_name,
				locality: row.locality,
				municipality_name: row.municipality_name,
				facilities: joinedProperties.filter(prop => row[prop]),
			};
			stops.push(newRow);
		}

		if (stops.find(stop => stop.stop_id === STOP_ID) === undefined) {
			console.log('tripId', tripForStopsResult.rows[0].trip_id);
			console.table(stops);
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
			periods: Object.entries(timesByPeriodByDayType).map(([period, dayTypes]) => {
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
					period_id: period,
					period_name: periods.get(period),
					weekdays: dayTypes.weekdays ? Object.entries(dayTypes.weekdays).map(([time, exceptions]) => getPeriod(time, exceptions)) : [],
					saturdays: dayTypes.saturdays ? Object.entries(dayTypes.saturdays).map(([time, exceptions]) => getPeriod(time, exceptions)) : [],
					sundays_holidays: dayTypes.sundays_holidays ? Object.entries(dayTypes.sundays_holidays).map(([time, exceptions]) => getPeriod(time, exceptions)) : [],
				};
			}),
			exceptions: Array.from(mergedExceptions.values()),
			stops: stops,
		};
		bulkData.push([`timetables:${LINE_ID}/${STOP_ID}`, JSON.stringify(timetable)]);
		console.timeEnd(`${i++}/${lineStopPairs.length} -> Line ${LINE_ID} stop ${STOP_ID}`);
	}
	const allLineTime = process.hrtime.bigint() - allLineStartTime;
	console.log(`Spent ${formatTime(cumulativeQueryTime)} on ${lineStops.length} queries`);
	// and now for the rest of the time
	console.log(`Spent ${formatTime(allLineTime - cumulativeQueryTime)} on other stuff`);
	await client.mSet(bulkData);

	// 9.
	// Log elapsed time in the current operation
	const elapsedTime = getElapsedTime(startTime);
	console.log(`⤷ Done updating Municipalities (${elapsedTime}).`);

	//
};