/* * */

const SERVERDB = require('../services/SERVERDB');

/* * */

module.exports.all = async (request, reply) => {
  const allItems = await SERVERDB.client.get('periods:all');
  return reply.send(allItems || []);
};
