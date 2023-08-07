/* * */
/* IMPORTS */
const GTFSAPIDB = require('../services/GTFSAPIDB');

//
module.exports.all = async (request, reply) => {
  const foundManyDocuments = await GTFSAPIDB.Municipality.find().lean();
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  foundManyDocuments.sort((a, b) => collator.compare(a.name, b.name));
  return reply.send(foundManyDocuments || []);
};

//
module.exports.single = async (request, reply) => {
  const foundOneDocument = await GTFSAPIDB.Municipality.findOne({ code: { $eq: request.params.code } }).lean();
  return reply.send(foundOneDocument || {});
};
