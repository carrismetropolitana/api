//
const SERVERDB = require('../services/SERVERDB');

//
module.exports.all = async (request, reply) => {
  const allSchoolsData = await SERVERDB.client.get('schools:all');
  return reply.send(JSON.parse(allSchoolsData) || []);
};

//
module.exports.single = async (request, reply) => {
  const schoolData = await SERVERDB.client.get(`schools:${request.params.code}`);
  return reply.send(JSON.parse(schoolData) || {});
};
