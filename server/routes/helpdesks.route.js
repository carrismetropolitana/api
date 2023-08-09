/* * */
/* IMPORTS */
const SERVERDB = require('../services/SERVERDB');

//
module.exports.all = async (request, reply) => {
  const foundManyDocuments = await SERVERDB.Helpdesk.find().lean();
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  foundManyDocuments.sort((a, b) => collator.compare(a.code, b.code));
  return reply.send(foundManyDocuments || []);
};

//
module.exports.single = async (request, reply) => {
  const foundOneDocument = await SERVERDB.Helpdesk.findOne({ code: { $eq: request.params.code } }).lean();
  return reply.send(foundOneDocument || {});
};
