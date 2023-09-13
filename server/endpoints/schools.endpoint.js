//
const SERVERDBREDIS = require('../services/SERVERDBREDIS');

//
module.exports.all = async (request, reply) => {
  const allSchoolsData = await SERVERDBREDIS.client.get('schools:all');
  return reply.send(JSON.parse(allSchoolsData) || []);
};

//
module.exports.single = async (request, reply) => {
  const schoolData = await SERVERDBREDIS.client.get(`schools:${request.params.code}`);
  return reply.send(JSON.parse(schoolData) || {});
};
