/* * */

const SERVERDB = require('../services/SERVERDB');

/* * */

module.exports.all = async (request, reply) => {
  const allItems = await SERVERDB.client.get('lines:all');
  return reply.send(allItems || []);
};

module.exports.single = async (request, reply) => {
  const singleItem = await SERVERDB.client.get(`lines:${request.params.id}`);
  return reply.send(singleItem || {});
};
