/* * */
/* IMPORTS */
const GTFSAPIDB = require('../services/GTFSAPIDB');

//
module.exports.all = async (request, reply) => {
  const foundManyDocuments = await GTFSAPIDB.Facility.find();
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  foundManyDocuments.sort((a, b) => collator.compare(a.code, b.code));
  return reply.send(foundManyDocuments);
};

//
module.exports.single = async (request, reply) => {
  const foundOneDocument = await GTFSAPIDB.Facility.findOne({ code: { $eq: request.params.code } });
  return reply.send(foundOneDocument || {});
};
