//
const SERVERDB = require('../services/SERVERDB');

//
module.exports.all = async (request, reply) => {
  const allLinesData = await SERVERDB.client.get('lines:all');
  return reply.send(JSON.parse(allLinesData) || []);
};

//
module.exports.single = async (request, reply) => {
  const lineData = await SERVERDB.client.get(`lines:${request.params.code}`);
  return reply.send(JSON.parse(lineData) || {});
};
