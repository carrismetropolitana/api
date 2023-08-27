/* * */
/* IMPORTS */
const { PCGI_BASE_URL_DEV } = process.env;

//
module.exports.all = async (request, reply) => {
  const allVehiclesResponse = await fetch(`${PCGI_BASE_URL_DEV}/vehiclelocation/vehiclePosition/mapVehicles`);
  const allVehiclesData = await allVehiclesResponse.json();
  const allVehiclesFormatted = allVehiclesData.map((element) => {
    return {
      code: element.Vid,
      trip_code: element.Lna,
      lat: element.Lat,
      lon: element.Lng,
      heading: element.Coa,
      speed: element.Spd,
      timestamp: element.Ts,
      // deprecated
      vehicle_id: element.Vid,
      trip_id: element.Lna,
      latitude: element.Lat,
      longitude: element.Lng,
    };
  });
  return reply.send(allVehiclesFormatted || []);
};
