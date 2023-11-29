/* * */

const SERVERDB = require('../services/SERVERDB');

/* * */

module.exports.all = async (request, reply) => {
  // Disabled endpoint
  return reply.send([]);
};

module.exports.single = async (request, reply) => {
  const singleItem = await SERVERDB.client.get(`shapes:${request.params.id}`);
  return reply.send(singleItem || {});
};
