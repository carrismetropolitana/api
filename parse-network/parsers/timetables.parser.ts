/* * */

import { connection } from '../services/NETWORKDB';
import { client } from '../services/SERVERDB';
import { getElapsedTime } from '../modules/timeCalc';
import { MonPeriod, MonStop } from '../services/NETWORKDB.types';
import { Timetable } from './timetableExample';
import { QueryResult } from 'pg';
import { exit } from 'process';

/* * */

export default async () => {
	//

	const LINE_ID = '4701';

	const STOP_ID = '090207';

	// 1.
	// Record the start time to later calculate operation duration
	const startTime = process.hrtime();

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
			)`);

	// 2.
	// Fetch all Periods from Redis
	console.log(`⤷ Querying Periods...`);
	const stop: MonStop = JSON.parse(await client.get(`stops:${STOP_ID}`));
	// Sanity check
	if (!stop.lines.includes(LINE_ID)) {
		console.log(`⤷ Stop ${STOP_ID} does not belong to line ${LINE_ID}.`);
		return;
	}
	const patterns = stop.patterns.filter(pattern => pattern.startsWith(LINE_ID));
	console.log('patterns', patterns);

	const dayTypes = new Map<string, 'weekdays' | 'saturdays' | 'sundays_holidays'>([['1', 'weekdays'], ['2', 'saturdays'], ['3', 'sundays_holidays']]);
	const periods = new Map((await connection.query<GTFSPeriod>(`SELECT * FROM periods`)).rows
		.map(period => [period.period_id, period.period_name]));
	// console.log('relevantTrips', relevantTrips.rows.slice(0, 3))
	// console.log('relevantDates', relevantDates.rows.slice(0, 3))
	// console.log('relevantStopTimes', relevantStopTimes.rows.slice(0, 3))

	const exceptionsQuery = `
    SELECT DISTINCT trips.calendar_desc
    FROM trips
    WHERE trips.pattern_id = ANY($1)
      AND trips.calendar_desc IS NOT NULL
  `;

	const timesByPeriodByDayTypeQuery = `
    SELECT
      periods.period_id,
      calendar_dates.day_type,
      stop_times.arrival_time,
      trips.calendar_desc,
			trips.route_id,
			routes.route_long_name
    FROM
      stop_times_without_last_stop AS stop_times
      JOIN trips ON stop_times.trip_id = trips.trip_id
      JOIN calendar_dates ON trips.service_id = calendar_dates.service_id
      JOIN periods ON calendar_dates.period = periods.period_id
			JOIN routes ON trips.route_id = routes.route_id
    WHERE
      stop_times.stop_id = $1
      AND trips.pattern_id = ANY($2)
      AND stop_times.arrival_time IS NOT NULL
    GROUP BY
      periods.period_id,
      periods.period_name,
      calendar_dates.day_type,
      stop_times.arrival_time,
      trips.calendar_desc,
			trips.route_id,
			routes.route_long_name
  `;

	const timesByPeriodByDayTypeResult = await connection.query<{
    period_id: string,
    day_type: string,
    arrival_time: string,
    calendar_desc: null | string,
		route_id: string,
		route_long_name: string
  }>(timesByPeriodByDayTypeQuery, [STOP_ID, patterns]);
	const variants = new Map<string, string>(timesByPeriodByDayTypeResult.rows.map(row => [row.route_id, row.route_long_name]));

	const exceptionsResult = await connection.query<{ calendar_desc: string }>(exceptionsQuery, [patterns]);
	const exceptions = new Map(exceptionsResult.rows.map((row, index) => {
		return [row.calendar_desc, {
			id: String.fromCharCode(97 + index),
			label: String.fromCharCode(97 + index) + ')',
			text: row.calendar_desc,
		}];
	}));

	console.log('variants', variants);
	const variantExceptions = new Map<string, {label:string, text:string, id:string}>;

	let variantExceptionId = exceptions.size;
	if (variants.size > 1) {
		console.log(`⤷ Stop ${STOP_ID} has more than one variant.`, Array.from(variants));
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
	console.log('variantExceptions', variantExceptions);

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
		console.log('variantException', variantException, row.route_id, variantExceptions.get(row.route_id));
		if (variantException) {
			timesByPeriodByDayType[period_id][dt][arrival_time].push(variantException.id);
		}
	});
	console.log('timesByPeriodByDayType', JSON.stringify(timesByPeriodByDayType, null, 2));

	const mappedVariantExceptions = new Map(Array.from(variantExceptions).map(([_, exception]) => [exception.id, exception]));
	const mappedExceptions = new Map(Array.from(exceptions).map(([_, exception]) => [exception.id, exception]));
	const mergedExceptions: Map<string, {id:string, label:string, text:string}> = new Map([...mappedExceptions, ...mappedVariantExceptions]);
	console.log('mergedExceptions', mergedExceptions);

	const timetable: Timetable = {
		periods: Object.entries(timesByPeriodByDayType).map(([period, dayTypes]) => {
			const getPeriod = (time: string, _exceptions: string[]) => ({
				time,
				exceptions: _exceptions.map(ex => {
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
	};
	console.log('timetable', JSON.stringify(timetable, null, 2));

	// 9.
	// Log elapsed time in the current operation
	const elapsedTime = getElapsedTime(startTime);
	console.log(`⤷ Done updating Municipalities (${elapsedTime}).`);

	//
};