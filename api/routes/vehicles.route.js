/* * */
/* IMPORTS */
const PCGIAPI = require('../services/PCGIAPI');

//
module.exports.all = async (request, reply) => {
  const allVehicles = await PCGIAPI.request('vehiclelocation/vehiclePosition/mapVehicles');
  console.log(allVehicles[0]);
  const allVehiclesFormatted = allVehicles.map((element) => {
    return {
      vehicle_id: element.Vid,
      trip_id: element.Lna,
      latitude: element.Lat,
      longitude: element.Lng,
      heading: element.Coa,
      speed: element.Spd,
    };
  });
  return reply.send(allVehiclesFormatted);
};
