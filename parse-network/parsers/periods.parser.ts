/* * */

import { DateTime } from 'luxon';
import { connection } from '../services/NETWORKDB';
import { client } from '../services/SERVERDB';
import { getElapsedTime } from '../modules/timeCalc';
import collator from '../modules/sortCollator';

/* * */

export default async () => {
  //
  // 1.
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();

  // 2.
  // Fetch all calendar dates from Postgres
  console.log(`⤷ Querying database...`);
  const allPeriods = await connection.query<GTFSPeriod>('SELECT * FROM periods');
  const allDates = await connection.query<GTFSDate>('SELECT * FROM dates');

  // 3.
  // Build periods hashmap
  const allPeriodsParsed = allPeriods.rows.map((period) => {
    //
    // 3.1.
    // Parse the dates associated with this period
    const datesForThisPeriod = allDates.rows
      .filter((date) => date.period === period.period_id)
      .map((date) => date.date)
      .sort((a, b) => collator.compare(a, b));

    // 3.2.
    // Initiate a variable to hold the active blocks for this period
    const validFromUntil = [];

    // 3.3.
    // Start the block with the first date for this period
    let currentBlock: {
      from: string;
      until?: string;
    } = {
      from: datesForThisPeriod[0],
    };

    // 3.4.
    // Iterate on all dates for this period
    for (let i = 1; i < datesForThisPeriod.length; i++) {
      // Setup the next and previous date strings
      const prevDateString = datesForThisPeriod[i - 1];
      const nextDateString = datesForThisPeriod[i];
      // Setup the next and previous date objects
      const prevDate = DateTime.fromFormat(prevDateString, 'yyyyMMdd');
      const nextDate = DateTime.fromFormat(nextDateString, 'yyyyMMdd');
      // Add a new block if the next date is not sequential to the previous date
      if (prevDate.toFormat('yyyyMMdd') !== nextDate.minus({ days: 1 }).toFormat('yyyyMMdd')) {
        currentBlock.until = prevDateString;
        validFromUntil.push(currentBlock);
        currentBlock = {
          from: nextDateString,
        };
      }
    }

    // 3.5.
    // Add the last block
    currentBlock.until = datesForThisPeriod[datesForThisPeriod.length - 1];
    validFromUntil.push(currentBlock);

    // 3.6.
    // Return the parsed period
    return {
      id: period.period_id,
      name: period.period_name,
      dates: datesForThisPeriod,
      valid: validFromUntil,
    };

    //
  });

  // 4.
  // Sort each period in the array
  allPeriodsParsed.sort((a, b) => collator.compare(a.id, b.id));

  // 5.
  // Log count of updated Periods
  console.log(`⤷ Updated ${allPeriodsParsed.length} Periods.`);

  // 6.
  // Save the array to the database
  await client.set('periods:all', JSON.stringify(allPeriodsParsed));

  // 7.
  // Log elapsed time in the current operation
  const elapsedTime = getElapsedTime(startTime);
  console.log(`⤷ Done updating Periods (${elapsedTime}).`);

  //
};
