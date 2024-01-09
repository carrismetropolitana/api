/* * */

const fs = require('fs');
const Papa = require('papaparse');
const SERVERDB = require('../services/SERVERDB');
const timeCalc = require('../modules/timeCalc');
const settings = require('../config/settings');

/* * */

module.exports = async () => {
  //
  // 1.
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();

  // 2.
  // Read directory from cloned repository
  console.log(`⤷ Open directory...`);
  const allDirectoryFilenames = fs.readdirSync(`${settings.BASE_DIR}/demand/date-line-stop`, { encoding: 'utf-8' });

  // 3.
  // Create the different views
  await viewByTotalForEachDateForEachStop(allDirectoryFilenames);

  // 4.
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating datasets/demand/date-line-stop (${elapsedTime}).`);

  //
};

/* * */

async function viewByTotalForEachDateForEachStop(allFilenames) {
  // Setup result variable
  const result = {};
  // Open each file from directory
  for (const filename of allFilenames) {
    // Open and parse file
    const fileDataRaw = fs.readFileSync(`${settings.BASE_DIR}/demand/date-line-stop/${filename}`, { encoding: 'utf-8' });
    const fileDataCsv = Papa.parse(fileDataRaw, { header: true });
    // Parse file contents
    fileDataCsv.data.forEach((row) => {
      // Create an entry for the current date if it was not seen before
      if (!result[row.date]) result[row.date] = {};
      // Create an entry for the current stop_id if it was not seen before
      if (!result[row.date][row.stop_id]) result[row.date][row.stop_id] = 0;
      // If the date and stop_id combination was seen before, add the validations value
      result[row.date][row.stop_id] += Number(row.validations);
      //
    });
    //
  }
  // Save the result to the database
  await SERVERDB.client.set('datasets/demand/date-line-stop/view-by-date-by-stop', JSON.stringify(result));
  //
}
