/* * */
/* IMPORTS */
const GTFSAPIDB = require('../services/GTFSAPIDB');

//
module.exports.all = async (request, reply) => {
  // Disabled endpoint
  return reply.send([]);
};

//
module.exports.single = async (request, reply) => {
  const foundOneDocument = await GTFSAPIDB.Pattern.findOne({ code: { $eq: request.params.code } }).lean();
  return reply.send(foundOneDocument || {});
};
