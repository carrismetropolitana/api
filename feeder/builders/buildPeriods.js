/* * */

const FEEDERDB = require('../services/FEEDERDB');
const SERVERDB = require('../services/SERVERDB');
const timeCalc = require('../modules/timeCalc');
const collator = require('../modules/sortCollator');

/* * */

module.exports = async () => {
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();
  // Fetch all calendar dates from Postgres
  console.log(`⤷ Querying database...`);
  const allPeriods = await FEEDERDB.connection.query('SELECT * FROM periods');
  const allDates = await FEEDERDB.connection.query('SELECT * FROM dates');
  // Build periods hashmap
  const allPeriodsParsed = allPeriods.rows.map((period) => {
    // Parse the dates associated with this period
    const datesForThisPeriod = allDates.rows
      .filter((date) => date.period === period.period_id)
      .map((date) => date.date)
      .sort((a, b) => collator.compare(a, b));
    // Initiate a variable to hold the active blocks for this period
    const validFromUntil = [];
    // Start the block with the first date for this period
    let currentBlock = {
      from: datesForThisPeriod[0],
    };
    // Iterate on all dates for this period
    for (let i = 1; i < datesForThisPeriod.length; i++) {
      // Setup the current and previous dates
      const prevDate = datesForThisPeriod[i - 1];
      const currDate = datesForThisPeriod[i];
      // Add a new block if the current date is not sequential to the previous date
      if (currDate - prevDate !== 1) {
        currentBlock.until = prevDate;
        validFromUntil.push(currentBlock);
        currentBlock = {
          from: currDate,
        };
      }
    }
    // Add the last block
    currentBlock.until = datesForThisPeriod[datesForThisPeriod.length - 1];
    validFromUntil.push(currentBlock);
    // Return the parsed period
    return {
      id: period.period_id,
      name: period.period_name,
      dates: datesForThisPeriod,
      valid: validFromUntil,
    };
  });

  // Sort each period in the array
  allPeriodsParsed.sort((a, b) => collator.compare(a.id, b.id));
  // Log count of updated Periods
  console.log(`⤷ Updated ${allPeriodsParsed.length} Periods.`);
  // Save the array to the database
  await SERVERDB.client.set('periods:all', JSON.stringify(allPeriodsParsed));
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Periods (${elapsedTime}).`);
  //
};
