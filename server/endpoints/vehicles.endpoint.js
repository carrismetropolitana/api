//

const PCGIAPI = require('../services/PCGIAPI');

//
module.exports.all = async (request, reply) => {
  const allVehiclesData = await PCGIAPI.request('vehiclelocation/vehiclePosition/mapVehicles');
  const allVehiclesFormatted = allVehiclesData.map((vehicle) => {
    return {
      code: vehicle.Vid,
      lat: vehicle.Lat,
      lon: vehicle.Lng,
      speed: vehicle.Spd,
      timestamp: vehicle.Ts,
      heading: vehicle.Coa,
      trip_code: vehicle.Lna,
      pattern_code: vehicle.Lna?.substring(0, 8),
    };
  });
  return reply.send(allVehiclesFormatted || []);
};
