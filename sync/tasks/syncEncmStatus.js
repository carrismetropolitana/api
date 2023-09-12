//

const SERVERDB = require('../services/SERVERDB');
const IXAPI = require('../services/IXAPI');
const timeCalc = require('../services/timeCalc');

/**
 * UPDATE ENCM STATUS
 */

module.exports = async () => {
  // Setup flag to avoid overlapping runs
  let RUN_ON_INTERVAL = 30000;
  // Setup flag to avoid overlapping runs
  let TASK_IS_RUNNING = false;
  // Schedule task (https://crontab.guru/#*_*_*_*_*)
  setInterval(async () => {
    // Check if task is already running
    if (TASK_IS_RUNNING) throw new Error('Force restart program.');
    // Switch the flag ON
    TASK_IS_RUNNING = true;
    // Record the start time to later calculate operation duration
    console.log();
    console.log(`------------------------------------------------------------------------------------------------------------------------`);
    console.log(`→ Updating ENCM status...`);
    const startTime = process.hrtime();
    // Retrieve ENCM from database
    const foundManyDocuments = await SERVERDB.Encm.find().lean();
    // Query IXAPI for the status of the requested ENCM
    const allEncmTicketsWaiting = await IXAPI.request({ reportType: 'ticket', status: 'W', initialDate: getIxDateString(-7200), finalDate: getIxDateString() });
    // Query IXAPI for the status of the requested ENCM
    const allEncmStatistics = await IXAPI.request({ reportType: 'entityReport', initialDate: getIxDateString(-7200), finalDate: getIxDateString() });
    // Add realtime status to each ENCM
    for (const foundDocument of foundManyDocuments) {
      // Filter all waiting ticket by the current ENCM code
      const encmTicketsWaiting = allEncmTicketsWaiting?.content?.ticket?.filter((item) => item.siteEID === foundDocument.code);
      // Find the entityReport entry for the current ENCM
      const encmStatistics = allEncmStatistics?.content?.entityReport?.find((item) => item.siteEID === foundDocument.code);
      // Format the update query with the request results
      const updatedDocumentValues = {
        currently_waiting: encmTicketsWaiting?.length || 0,
        expected_wait_time: encmStatistics?.averageWaitTime || 0,
      };
      // Update the current document with the new values
      await SERVERDB.Encm.findOneAndUpdate({ code: foundDocument.code }, updatedDocumentValues, { new: true, upsert: true });
      // Log progress
      console.log(`→ Updated Encm ${foundDocument.name} (${foundDocument.code}): currently_waiting: ${updatedDocumentValues.currently_waiting}; expected_wait_time: ${updatedDocumentValues.expected_wait_time}`);
      //
    }
    // Switch the flag OFF
    TASK_IS_RUNNING = false;
    // Log elapsed time in the current operation
    const elapsedTime = timeCalc.getElapsedTime(startTime);
    console.log(`→ Task completed: Updated ENCM status (${foundManyDocuments.length} documents in ${elapsedTime}).`);
    console.log(`------------------------------------------------------------------------------------------------------------------------`);
    console.log();

    //
  }, RUN_ON_INTERVAL);

  //
};

//
//
//

function getIxDateString(adjustmentSeconds = 0) {
  const dateObj = new Date();
  // Apply the adjustment to the current date
  dateObj.setSeconds(dateObj.getSeconds() + adjustmentSeconds);
  // Get the components of the date
  const year = dateObj.getFullYear().toString().padStart(4, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const seconds = dateObj.getSeconds().toString().padStart(2, '0');
  // Format the date string
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  // Return result
  return formattedDate;
}