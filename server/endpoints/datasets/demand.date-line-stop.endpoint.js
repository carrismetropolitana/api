/* * */

const SERVERDB = require('../../services/SERVERDB');

/* * */

module.exports.all = async (request, reply) => {
  const allItems = await SERVERDB.client.get('demand:date-line-stop');
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(allItems || []);
};
