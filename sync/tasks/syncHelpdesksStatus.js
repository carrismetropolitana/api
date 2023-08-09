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
  // Map all helpdesk codes into a comma separated string
  //   const helpdeskCodes = foundManyDocuments.map((item) => item.code).join(',');

  // Query IXAPI for the status of the requested helpdesk
  const allHelpdesksTickets = await IXAPI.request({ reportType: 'ticket', initialDate: getIxDateString(-7200), finalDate: getIxDateString() });
  console.log('allHelpdesksTickets', allHelpdesksTickets);
  // Exit current iteration early if expected request result is undefined
  //   if (!allHelpdesksTickets?.content?.ticket?.length) continue;
  // Reduce result into a sum of tickets for each helpdesk

  // Query IXAPI for the status of the requested helpdesk
  const allHelpdesksStatistics = await IXAPI.request({ reportType: 'entityReport', initialDate: getIxDateString(-7200), finalDate: getIxDateString() });
  console.log('allHelpdesksStatistics.content.entityReport', allHelpdesksStatistics.content.entityReport);
  // Exit current iteration early if expected request result is undefined
  //   if (!allHelpdesksStatistics?.content?.entityReport?.length) continue;

  // Add realtime status to each helpdesk
  for (const foundDocument of foundManyDocuments) {
    // Lorem ipsum
    const helpdeskTickets = allHelpdesksTickets.content.ticket.filter((item) => item.siteEID === foundDocument.code);
    // Lorem ipsum
    const helpdeskStatistics = allHelpdesksStatistics.content.entityReport.find((item) => item.siteEID === foundDocument.code);
    // Parse the response result to match the desired structure
    foundDocument.currently_waiting = helpdeskTickets?.length || 0;
    foundDocument.expected_wait_time = helpdeskStatistics?.averageWaitTime || 0;

    console.log('-------------------');
    console.log(foundDocument.code);
    console.log(foundDocument.currently_waiting);
    console.log(foundDocument.expected_wait_time);
    console.log('-------------------');
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
