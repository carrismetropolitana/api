/* * */
/* IMPORTS */
const GTFSAPIDB = require('../services/GTFSAPIDB');
const IXAPI = require('../services/IXAPI');

//
module.exports.all = async (request, reply) => {
  const foundManyDocuments = await GTFSAPIDB.Store.find();
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  foundManyDocuments.sort((a, b) => collator.compare(a.code, b.code));
  return reply.send(foundManyDocuments || []);
};

//
module.exports.single = async (request, reply) => {
  const foundOneDocument = await GTFSAPIDB.Store.findOne({ code: { $eq: request.params.code } });
  return reply.send(foundOneDocument || {});
};

//
module.exports.singleWithRealtime = async (request, reply) => {
  const result = await IXAPI.request('openservices/estimatedStopSchedules', {
    method: 'POST',
    body: {
      operators: ['41', '42', '43', '44'],
      stops: [request.params.code],
      numResults: 15,
    },
  });
  result.forEach((element) => delete element.observedDriverId); // Remove useless property
  return reply.send(result || {});
};
