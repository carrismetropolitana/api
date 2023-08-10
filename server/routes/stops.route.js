/* * */
/* IMPORTS */
const SERVERDB = require('../services/SERVERDB');
const PCGIAPI = require('../services/PCGIAPI');

//
module.exports.all = async (request, reply) => {
  const foundManyDocuments = await SERVERDB.Stop.find().lean();
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  foundManyDocuments.sort((a, b) => collator.compare(a.code, b.code));
  return reply.send(foundManyDocuments || []);
};

//
module.exports.single = async (request, reply) => {
  const foundOneDocument = await SERVERDB.Stop.findOne({ code: { $eq: request.params.code } }).lean();
  return reply.send(foundOneDocument || {});
};

//
module.exports.singleWithRealtime = async (request, reply) => {
  const foundManyDocuments = await SERVERDB.Stop.find({}, 'code').lean();
  const allStopCodes = foundManyDocuments.map((item) => item.code);
  const result = await PCGIAPI.request('openservices/estimatedStopSchedules', {
    method: 'POST',
    body: {
      operators: ['41', '42', '43', '44'],
      //   stops: [request.params.code],
      stops: [allStopCodes],
      numResults: 1,
    },
  });
  result.forEach((element) => delete element.observedDriverId); // Remove useless property
  return reply.send(result || {});
};
