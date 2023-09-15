//
const SERVERDB = require('../services/SERVERDB');

//
module.exports.all = async (request, reply) => {
  const allItems = await SERVERDB.client.get('routes:all');
  return reply.send(JSON.parse(allItems) || []);
};

//
module.exports.single = async (request, reply) => {
  const singleItem = await SERVERDB.client.get(`routes:${request.params.id}`);
  return reply.send(JSON.parse(singleItem) || {});
};
