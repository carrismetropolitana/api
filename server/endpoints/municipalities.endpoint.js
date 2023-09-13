//
const SERVERDB = require('../services/SERVERDB');

//
module.exports.all = async (request, reply) => {
  const allMunicipalitiesData = await SERVERDB.client.get('municipalities:all');
  return reply.send(JSON.parse(allMunicipalitiesData) || []);
};

//
module.exports.single = async (request, reply) => {
  const municipalityData = await SERVERDB.client.get(`municipalities:${request.params.code}`);
  return reply.send(JSON.parse(municipalityData) || {});
};
