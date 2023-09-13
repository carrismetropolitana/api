//
const SERVERDB = require('../services/SERVERDB');

//
module.exports.all = async (request, reply) => {
  const allEncmData = await SERVERDB.client.get('encm:all');
  return reply.send(JSON.parse(allEncmData) || []);
};

//
module.exports.single = async (request, reply) => {
  const encmData = await SERVERDB.client.get(`encm:${request.params.code}`);
  return reply.send(JSON.parse(encmData) || {});
};
