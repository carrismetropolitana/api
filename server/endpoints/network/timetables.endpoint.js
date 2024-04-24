/* * */

const SERVERDB = require('../../services/SERVERDB');

/* * */

module.exports.all = async (request, reply) => {
  // Disabled endpoint
  return reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send([]);
};
module.exports.index = async (request, reply) => {
  // Disabled endpoint
  const index = await SERVERDB.client.get(`timetables:index`);
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(index || {});
};

module.exports.single = async (request, reply) => {
  const singleItem = await SERVERDB.client.get(`timetables:${request.params.line_id}/${request.params.direction_id}/${request.params.stop_id}`);
  //4512/010136
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(singleItem || {});
};
