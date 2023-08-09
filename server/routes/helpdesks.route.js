/* * */
/* IMPORTS */
const GTFSAPIDB = require('../services/GTFSAPIDB');
const IXAPI = require('../services/IXAPI');

//
module.exports.all = async (request, reply) => {
  // Retrieve helpdesks from database
  const foundManyDocuments = await GTFSAPIDB.Helpdesk.find().lean();
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  foundManyDocuments.sort((a, b) => collator.compare(a.code, b.code));
  // Add realtime status to each helpdesk
  for (const foundDocument of foundManyDocuments) {
    // Setup the four default ticket categories
    foundDocument.status = [
      { category_code: 'A', currently_waiting: 0 },
      { category_code: 'B', currently_waiting: 0 },
      { category_code: 'C', currently_waiting: 0 },
      { category_code: 'D', currently_waiting: 0 },
    ];
    // Query IXAPI for the status of the requested helpdesk
    const result = await IXAPI.request({ helpdeskCode: foundDocument.code, initialDate: getIxDateString(-7200), finalDate: getIxDateString() });
    // Exit current iteration early if expected request result is undefined
    if (!result?.content?.ticket?.length) continue;
    // Parse the response result to match the desired structure
    for (const obj of result.content.ticket) {
      // Find index of current category object
      const categoryIndex = foundDocument.status.findIndex((item) => item.category_code === obj.categoryCode);
      // If the categoryCode is not yet present in the result array, add it with total 1
      if (categoryIndex === -1) foundDocument.status.push({ category_code: obj.categoryCode, currently_waiting: 1 });
      // If the categoryCode is already present, increase the total count by 1
      else foundDocument.status[categoryIndex].currently_waiting += 1;
    }
    //
  }
  // Return result to the caller
  return reply.send(foundManyDocuments || []);
  //
};

//
module.exports.single = async (request, reply) => {
  // Fetch all helpdesks using public API endpoint to ensure cache is hit
  const allHelpdesksRes = await fetch('https://api.carrismetropolitana.pt/helpdesks');
  const allHelpdesksData = await allHelpdesksRes.json();
  // Find the requested helpdesk in response json
  const foundHelpdesk = allHelpdesksData.find((item) => item.code === request.params.code);
  // Return result
  return reply.send(foundHelpdesk || {});
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
