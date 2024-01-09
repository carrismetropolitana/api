/* * */

const SERVERDB = require('../../services/SERVERDB');

/* * */

module.exports.viewByTotalForEachDateForEachStop = async (request, reply) => {
  const viewData = await SERVERDB.client.get('datasets/demand/date-line-stop/view-by-date-by-stop');
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(viewData || []);
};
