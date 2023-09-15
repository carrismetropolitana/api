//

const PCGIAPI = require('../services/PCGIAPI');

//
module.exports.all = async (request, reply) => {
  const allVehiclesData = await PCGIAPI.request('vehiclelocation/vehiclePosition/mapVehicles');
  const allVehiclesFormatted = allVehiclesData.map((vehicle) => {
    return {
      id: vehicle.Vid,
      lat: vehicle.Lat,
      lon: vehicle.Lng,
      speed: vehicle.Spd,
      timestamp: vehicle.Ts,
      heading: vehicle.Coa,
      trip_id: vehicle.Lna,
      pattern_id: vehicle.Lna?.substring(0, 8),
    };
  });
  return reply.send(allVehiclesFormatted || []);
};
