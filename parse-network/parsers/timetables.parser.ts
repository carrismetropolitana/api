/* * */

import { connection } from '../services/NETWORKDB';
import { client } from '../services/SERVERDB';
import { getElapsedTime } from '../modules/timeCalc';
import collator from '../modules/sortCollator';
import { MonPeriod, MonStop } from '../services/NETWORKDB.types';
import { Timetable } from './timetableExample';
import { QueryResult } from 'pg';

/* * */

export default async () => {
  //

  const LINE_ID = '4701';

  const STOP_ID = '090003'

  // 1.
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();

  // 2.
  // Fetch all Periods from Redis
  console.log(`⤷ Querying Periods...`);
  const stop: MonStop = JSON.parse(await client.get(`stops:${STOP_ID}`));
  // Sanity check
  if (!stop.lines.includes(LINE_ID)) {
    console.log(`⤷ Stop ${STOP_ID} does not belong to line ${LINE_ID}.`);
    return;
  }
  const patterns = stop.patterns.filter((pattern) => pattern.startsWith(LINE_ID));
  console.log('patterns', patterns);
  const routes = stop.routes.filter((route) => route.startsWith(LINE_ID));
  const line = JSON.parse(await client.get(`lines:${LINE_ID}`));
  const relevantTrips = await connection.query<GTFSTrip>(`SELECT * FROM trips WHERE pattern_id = ANY($1)`, [patterns]);
  const relevantDates = await connection.query<GTFSCalendarDate>(`SELECT * FROM calendar_dates WHERE service_id = ANY($1)`, [relevantTrips.rows.map((trip) => trip.service_id)]);
  const relevantStopTimes = await connection.query<GTFSStopTime>(`SELECT * FROM stop_times WHERE trip_id = ANY($1) AND stop_id = ($2)`, [relevantTrips.rows.map((trip) => trip.trip_id), STOP_ID]);
  const periods = new Map((await connection.query<GTFSPeriod>(`SELECT * FROM periods`)).rows
    .map((period) => [period.period_id, period.period_name]));

  const dayTypes = new Map<string, "weekdays" | "saturdays" | "sundays_holidays">([["1", "weekdays"], ["2", "saturdays"], ["3", "sundays_holidays"]]);

  console.log('relevantTrips', relevantTrips.rows.slice(0, 3))
  console.log('relevantDates', relevantDates.rows.slice(0, 3))
  console.log('relevantStopTimes', relevantStopTimes.rows.slice(0, 3))



  // stop_times[trip_id] -> trips[trip_id]-[service_id] -> calendar_dates[service_id]-[period] 
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
  }
    = {
  };
  for (const stopTime of relevantStopTimes.rows) {
    const trip = relevantTrips.rows.find((trip) => trip.trip_id === stopTime.trip_id);
    const date = relevantDates.rows.find((date) => date.service_id === trip.service_id);
    const day_type = dayTypes.get(date.day_type);
    const periodName = periods.get(date.period);
    if (!timesByPeriodByDayType[date.period]) {
      timesByPeriodByDayType[date.period] = {};
    }
    if (!timesByPeriodByDayType[date.period][day_type]) {
      timesByPeriodByDayType[date.period][day_type] = {};
    }
    if (!timesByPeriodByDayType[date.period][day_type][stopTime.arrival_time]) {
      timesByPeriodByDayType[date.period][day_type][stopTime.arrival_time] = [];
    }
    if (trip.calendar_desc) {
      timesByPeriodByDayType[date.period][day_type][stopTime.arrival_time].push(trip.calendar_desc);
    }
  }

  const exceptions = new Map(Array.from(relevantTrips.rows.reduce((acc, trip) => {
    if (trip.calendar_desc) {
      acc.add(trip.calendar_desc);
    }
    return acc;
  }, new Set<string>()).values()).map((exception, index) => {
    return [exception, {
      id: String.fromCharCode(97 + index),
      label: String.fromCharCode(97 + index) + ")",
      text: exception
    }]
  }))

  const timetable: Timetable = {
    periods: Object.entries(timesByPeriodByDayType).map(([period, dayTypes]) => {
      const getPeriod = (time: string, _exceptions: string[]) => ({
        time,
        exceptions: _exceptions.map((ex) => exceptions.get(ex))
      });

      return {
        period_id: period,
        period_name: periods.get(period),
        weekdays: dayTypes.weekdays ? Object.entries(dayTypes.weekdays).map(([time, exceptions]) => getPeriod(time, exceptions)) : [],
        saturdays: dayTypes.saturdays ? Object.entries(dayTypes.saturdays).map(([time, exceptions]) => getPeriod(time, exceptions)) : [],
        sundays_holidays: dayTypes.sundays_holidays ? Object.entries(dayTypes.sundays_holidays).map(([time, exceptions]) => getPeriod(time, exceptions)) : [],
      }
    }),
    exceptions: Array.from(exceptions.values())
  }
  console.log('timetable', JSON.stringify(timetable, null, 2));



  // 9.
  // Log elapsed time in the current operation
  const elapsedTime = getElapsedTime(startTime);
  console.log(`⤷ Done updating Municipalities (${elapsedTime}).`);

  //
};
