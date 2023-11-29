/* * */

const FEEDERDB = require('../services/FEEDERDB');
const SERVERDB = require('../services/SERVERDB');
const timeCalc = require('../modules/timeCalc');

/* * */

module.exports = async () => {
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();
  // Fetch all calendar dates from Postgres
  console.log(`⤷ Querying database...`);
  const allCalendarDates = await FEEDERDB.connection.query('SELECT * FROM calendar_dates');
  // Log progress
  console.log(`⤷ Updating Periods...`);
  // Reduce calendar dates into periods
  let allPeriods = allCalendarDates.rows.reduce((accumulator, calendarDate) => {
    // Find the corresponding period in the accumulator array
    const periodIndex = accumulator.findIndex((item) => item.id === calendarDate.period);
    // If the period is found, add the date to its dates array
    if (periodIndex > 0) accumulator[periodIndex].dates.push(calendarDate.date);
    // If the period is not found, add it to the accumulator with an empty dates array
    else accumulator.push({ id: calendarDate.period, name: 'Period Name', dates: [calendarDate.date] });
    // Return the accumulator
    return accumulator;
  }, []);
  // Sort the dates for each period, as well each period in the array
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  allPeriods = allPeriods.map((period) => ({ ...period, dates: period.dates.sort((a, b) => collator.compare(a, b)) }));
  allPeriods.sort((a, b) => collator.compare(a.id, b.id));
  // Log count of updated Periods
  console.log(`⤷ Updated ${allPeriods.length} Periods.`);
  // Save the array to the database
  await SERVERDB.client.set('periods:all', JSON.stringify(allPeriods));
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Periods (${elapsedTime}).`);
  //
};