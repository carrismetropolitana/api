/* * */
/* IMPORTS */
const SERVERDB = require('../services/SERVERDB');

//
module.exports.all = async (request, reply) => {
  // Disabled endpoint
  return reply.send([]);
};

//
module.exports.single = async (request, reply) => {
  const foundOneDocument = await SERVERDB.Shape.findOne({ code: { $eq: request.params.code } }).lean();
  return reply.send(foundOneDocument || {});
};
