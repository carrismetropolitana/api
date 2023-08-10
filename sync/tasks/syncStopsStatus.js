/* * */
/* IMPORTS */
const SERVERDB = require('../services/SERVERDB');
const PCGIAPI = require('../services/PCGIAPI');

/**
 * UPDATE STOPS STATUS
 * Query 'stops' table to get all unique stops.
 * Save each result in MongoDB.
 */
module.exports = async () => {
  const foundManyDocuments = await SERVERDB.Stop.find({}, 'code').lean();
  const allStopCodes = foundManyDocuments.map((item) => item.code);
  console.log('allStopCodes', allStopCodes);
  const result = await PCGIAPI.request('openservices/estimatedStopSchedules', {
    method: 'POST',
    body: {
      operators: ['41', '42', '43', '44'],
      //   stops: [request.params.code],
      stops: allStopCodes,
      numResults: 1,
    },
  });
  console.log(result);
  console.log('result.length', result.length);
  //   result.forEach((element) => delete element.observedDriverId); // Remove useless property
  //
};
