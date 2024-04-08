/* * */

const NETWORKDB = require('../services/NETWORKDB');
const SERVERDB = require('../services/SERVERDB');
const timeCalc = require('../modules/timeCalc');
const collator = require('../modules/sortCollator');

/* * */

module.exports = async () => {
  //

  const PATTERN_ID = '4205_0_1';

  // 1.
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();

  // 2.
  // Fetch all Periods from Redis
  console.log(`⤷ Querying Periods...`);
  const allPeriodsTxt = await SERVERDB.client.get('periods:all');
  const allPeriodsJson = JSON.parse(allPeriodsTxt);
  const allPeriodsMap = new Map(allPeriodsJson.map((period) => [period.id, new Set(period.dates)]));

  // 2.
  // Fetch all Dates from Redis
  console.log(`⤷ Querying Dates...`);
  const allDatesTxt = await SERVERDB.client.get('dates:all');
  const allDatesJson = JSON.parse(allDatesTxt);
  const allDatesMap = new Map(allDatesJson.map((date) => [date.date, date]));

  // 2.
  // Fetch given pattern from Redis
  console.log(`⤷ Querying patterns...`);
  const patternsTxt = await SERVERDB.client.get(`patterns:${PATTERN_ID}`);
  const patternJson = JSON.parse(patternsTxt);

  // 3.
  // Initate a temporary variable to hold updated Municipalities
  const allMunicipalitiesData = [];
  const updatedMunicipalityKeys = new Set();

  // 4.
  // Log progress
  console.log(`⤷ Updating Timetables for this pattern...`);

  // 6.
  // For each stop in the trip
  for (const patternPath of patternJson.path) {
    //

    const finalTimetableForThisStop = {
      periods: [],
      exceptions: [],
    };

    for (const periodData of allPeriodsJson) {
      //

      const periodResult = {
        period_id: periodData.id,
        period_name: periodData.name,
        weekdays: [],
        saturdays: [],
        sundays_holidays: [],
      };

      const periodDatesSet = new Set(periodData.dates);

      for (const patternTrip of patternJson.trips) {
        //

        for (const tripSchedule of patternTrip.schedule) {
          //
          // skip if the schedule is not for the current path stop and stop_sequence
          if (tripSchedule.stop_id !== patternPath.stop.id || tripSchedule.stop_sequence !== patternPath.stop_sequence) continue;

          // Prepare schedule info
          const scheduleHours = tripSchedule.arrival_time.split(':')[0];
          const scheduleMinutes = tripSchedule.arrival_time.split(':')[1];

          // Now we check in which period and which day_type we should put the trip

          for (const tripDate of patternTrip.dates) {
            if (periodDatesSet.has(tripDate)) {
              const dateInfo = allDatesMap.get(tripDate);
              switch (dateInfo.day_type) {
                case '1':
                  // Check if there is already an object with the same hours
                  const hoursIndex1 = periodResult.weekdays.find((item) => item.hour === scheduleHours);
                  if (hoursIndex1 > -1) periodResult.weekdays[hoursIndex1].minutes.push({ minute: scheduleMinutes, trip_id: patternTrip.trip_id });
                  else periodResult.weekdays.push({ hour: scheduleHours, minutes: [{ minute: scheduleMinutes, trip_id: patternTrip.trip_id }] });
                  break;
                case '2':
                  const hoursIndex2 = periodResult.saturdays.find((item) => item.hour === scheduleHours);
                  if (hoursIndex2 > -1) periodResult.saturdays[hoursIndex2].minutes.push({ minute: scheduleMinutes, trip_id: patternTrip.trip_id });
                  else periodResult.saturdays.push({ hour: scheduleHours, minutes: [{ minute: scheduleMinutes, trip_id: patternTrip.trip_id }] });
                  break;
                case '3':
                  const hoursIndex3 = periodResult.sundays_holidays.find((item) => item.hour === scheduleHours);
                  if (hoursIndex3 > -1) periodResult.sundays_holidays[hoursIndex3].minutes.push({ minute: scheduleMinutes, trip_id: patternTrip.trip_id });
                  else periodResult.sundays_holidays.push({ hour: scheduleHours, minutes: [{ minute: scheduleMinutes, trip_id: patternTrip.trip_id }] });
                  periodResult.saturdays.push(tripDate);
                  break;
                default:
                  console.log(`⤷ Unknown day_type: ${dateInfo.day_type}`);
                  break;
              }
            }
          }

          //
        }

        //
      }

      finalTimetableForThisStop.periods.push(periodResult);

      //
    }

    // Update or create new document
    await SERVERDB.client.set(`timetables:${PATTERN_ID}-${patternPath.stop.id}-${patternPath.stop_sequence}`, JSON.stringify(finalTimetableForThisStop));
    updatedMunicipalityKeys.add(`timetables:${PATTERN_ID}-${patternPath.stop.id}-${patternPath.stop_sequence}`);

    //
  }

  // 6.
  // Log count of updated Municipalities
  console.log(`⤷ Updated ${updatedMunicipalityKeys.size} Municipalities.`);

  // 8.
  // Delete all Municipalities not present in the current update
  const allSavedMunicipalityKeys = [];
  for await (const key of SERVERDB.client.scanIterator({ TYPE: 'string', MATCH: 'timetables:*' })) {
    allSavedMunicipalityKeys.push(key);
  }
  const staleMunicipalityKeys = allSavedMunicipalityKeys.filter((id) => !updatedMunicipalityKeys.has(id));
  if (staleMunicipalityKeys.length) await SERVERDB.client.del(staleMunicipalityKeys);
  console.log(`⤷ Deleted ${staleMunicipalityKeys.length} stale Municipalities.`);

  // 9.
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Municipalities (${elapsedTime}).`);

  //
};
