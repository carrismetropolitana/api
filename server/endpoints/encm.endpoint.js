/* * */

const SERVERDB = require('../services/SERVERDB');

/* * */

module.exports.all = async (request, reply) => {
  const allItems = await SERVERDB.client.get('encm:all');
  return reply.send(allItems || []);
};

module.exports.single = async (request, reply) => {
  const singleItem = await SERVERDB.client.get(`encm:${request.params.id}`);
  return reply.send(singleItem || {});
};
