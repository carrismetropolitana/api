//

const SERVERDB = require('../services/SERVERDB');
const PCGIAPI = require('../services/PCGIAPI');

const regexPattern = /^\d{6}$/; // String with exactly 6 numeric digits

//
module.exports.all = async (request, reply) => {
  const foundManyDocuments = await SERVERDB.Stop.find().lean();
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  foundManyDocuments.sort((a, b) => collator.compare(a.code, b.code));
  return reply.send(foundManyDocuments || []);
};

//
module.exports.single = async (request, reply) => {
  if (!regexPattern.test(request.params.code)) return reply.status(400).send([]);
  const foundOneDocument = await SERVERDB.Stop.findOne({ code: { $eq: request.params.code } }).lean();
  return reply.send(foundOneDocument || {});
};

//
module.exports.singleWithRealtime = async (request, reply) => {
  if (!regexPattern.test(request.params.code)) return reply.status(400).send([]);
  const result = await PCGIAPI.request(`opcoremanager/stop-schedules/${request.params.code}`);
  result.forEach((element) => delete element.observedDriverId); // Remove useless property
  return reply.send(result || []);
};
