/* * */

const SERVERDB = require('../../services/SERVERDB');

/* * */

module.exports.all = async (request, reply) => {
  const allItems = await SERVERDB.client.get('datasets/facilities/encm/all');
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(allItems || []);
};

module.exports.single = async (request, reply) => {
  const singleItem = await SERVERDB.client.get(`datasets/facilities/encm/${request.params.id}`);
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(singleItem || {});
};
