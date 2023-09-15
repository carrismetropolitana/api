//
const SERVERDB = require('../services/SERVERDB');

//
module.exports.all = async (request, reply) => {
  const allItems = await SERVERDB.client.get('municipalities:all');
  return reply.send(JSON.parse(allItems) || []);
};

//
module.exports.single = async (request, reply) => {
  const singleItem = await SERVERDB.client.get(`municipalities:${request.params.id}`);
  return reply.send(JSON.parse(singleItem) || {});
};
