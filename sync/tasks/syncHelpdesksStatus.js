/* * */
/* IMPORTS */
const SERVERDB = require('../services/SERVERDB');
const IXAPI = require('../services/IXAPI');

/**
 * UPDATE HELPDESKS STATUS
 * Query 'stops' table to get all unique stops.
 * Save each result in MongoDB.
 */
module.exports = async () => {
  // Retrieve helpdesks from database
  const foundManyDocuments = await SERVERDB.Helpdesk.find();
  // Add realtime status to each helpdesk
  for (const foundDocument of foundManyDocuments) {
    // Query IXAPI for the status of the requested helpdesk
    const helpdeskTickets = await IXAPI.request({ reportType: 'ticket', helpdeskCode: foundDocument.code, initialDate: getIxDateString(-7200), finalDate: getIxDateString() });
    // Exit current iteration early if expected request result is undefined
    if (!helpdeskTickets?.content?.ticket?.length) continue;
    // Query IXAPI for the status of the requested helpdesk
    const helpdeskStatistics = await IXAPI.request({ reportType: 'entityReport', helpdeskCode: foundDocument.code, initialDate: getIxDateString(-7200), finalDate: getIxDateString() });
    // Exit current iteration early if expected request result is undefined
    if (!helpdeskStatistics?.content?.entityReport?.length) continue;
    // Parse the response result to match the desired structure
    foundDocument.currently_waiting = helpdeskTickets?.content?.ticket?.totalRows || 0;
    foundDocument.expected_wait_time = helpdeskTickets?.content?.entityReport?.averageWaitTime || 0;
    //
    await foundDocument.save();
    //
  }
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
