//
const SERVERDBREDIS = require('../services/SERVERDBREDIS');

//
module.exports.all = async (request, reply) => {
  // Disabled endpoint
  return reply.send([]);
};

//
module.exports.single = async (request, reply) => {
  const patternData = await SERVERDBREDIS.client.get(`patterns:${request.params.code}`);
  return reply.send(JSON.parse(patternData) || {});
};
