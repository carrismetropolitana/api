/* * */

const SERVERDB = require('../../services/SERVERDB');

/* * */

module.exports.all = async (request, reply) => {
  // Disabled endpoint
  return reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send([]);
};

module.exports.single = async (request, reply) => {
  // const singleItem = await SERVERDB.client.get(`patterns:${request.params.id}`);
  const singleItem = require("./pattern-5412_0_1.json")
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(singleItem || {});
};
