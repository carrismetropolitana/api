/* * */
/* IMPORTS */
const { PCGI_BASE_URL_DEV } = process.env;

//
module.exports.all = async (request, reply) => {
  const allVehiclesResponse = await fetch(`${PCGI_BASE_URL_DEV}/vehiclelocation/vehiclePosition/mapVehicles`);
  const allVehiclesData = await allVehiclesResponse.json();
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
      // deprecated
      vehicle_id: vehicle.Vid,
      trip_id: vehicle.Lna,
      latitude: vehicle.Lat,
      longitude: vehicle.Lng,
    };
  });
  return reply.send(allVehiclesFormatted || []);
};
