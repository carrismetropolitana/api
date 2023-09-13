//
const SERVERDBREDIS = require('../services/SERVERDBREDIS');

//
module.exports.all = async (request, reply) => {
  const allLinesData = await SERVERDBREDIS.client.get('lines:all');
  return reply.send(JSON.parse(allLinesData) || []);
};

//
module.exports.single = async (request, reply) => {
  const lineData = await SERVERDBREDIS.client.get(`lines:${request.params.code}`);
  return reply.send(JSON.parse(lineData) || {});
};
