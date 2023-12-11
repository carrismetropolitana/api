/* * */

const AVAILABLE_FACILITIES = ['schools', 'encm'];

/* * */

module.exports.all = async (request, reply) => {
  return reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(AVAILABLE_FACILITIES));
};
