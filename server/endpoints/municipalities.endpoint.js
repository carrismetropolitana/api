//
const SERVERDBREDIS = require('../services/SERVERDBREDIS');

//
module.exports.all = async (request, reply) => {
  const allMunicipalitiesData = await SERVERDBREDIS.client.get('municipalities:all');
  return reply.send(JSON.parse(allMunicipalitiesData) || []);
};

//
module.exports.single = async (request, reply) => {
  const municipalityData = await SERVERDBREDIS.client.get(`municipalities:${request.params.code}`);
  return reply.send(JSON.parse(municipalityData) || {});
};
