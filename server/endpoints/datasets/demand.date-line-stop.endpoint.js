/* * */

const SERVERDB = require('../../services/SERVERDB');

/* * */

module.exports.viewByDateForEachStop = async (request, reply) => {
  const viewData = await SERVERDB.client.get('datasets/demand/date-line-stop/viewByDateForEachStop');
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(viewData || []);
};

module.exports.viewByDateForEachLine = async (request, reply) => {
  const viewData = await SERVERDB.client.get('datasets/demand/date-line-stop/viewByDateForEachLine');
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(viewData || []);
};
