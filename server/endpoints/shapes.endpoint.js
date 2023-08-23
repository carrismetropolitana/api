/* * */
/* IMPORTS */
const SERVERDB = require('../services/SERVERDB');

//
module.exports.all = async (request, reply) => {
  // Disabled endpoint
  // return reply.send([]);
  //
  const foundManyDocuments = await SERVERDB.Shape.find().lean();
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  foundManyDocuments.sort((a, b) => collator.compare(a.code, b.code));
  return reply.send(foundManyDocuments || []);
};

//
module.exports.single = async (request, reply) => {
  const foundOneDocument = await SERVERDB.Shape.findOne({ code: { $eq: request.params.code } }).lean();
  return reply.send(foundOneDocument || {});
};
