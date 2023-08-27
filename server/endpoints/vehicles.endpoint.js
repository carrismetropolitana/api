/* * */
/* IMPORTS */
const { PCGI_BASE_URL_DEV } = process.env;

//
module.exports.all = async (request, reply) => {
  const allVehiclesResponse = await fetch(`${PCGI_BASE_URL_DEV}/vehiclelocation/vehiclePosition/mapVehicles`);
  const allVehiclesData = await allVehiclesResponse.json();
  const allVehiclesFormatted = allVehiclesData.map((element) => {
    return {
      vehicle_id: element.Vid,
      trip_id: element.Lna,
      latitude: element.Lat,
      longitude: element.Lng,
      heading: element.Coa,
      speed: element.Spd,
      timestamp: element.Cst,
    };
  });
  return reply.send(allVehiclesFormatted || []);
};
