/* * */

const { DateTime } = require('luxon');
const PCGIAPI = require('../services/PCGIAPI');

/* * */

function convertToUTC(localUnixTimestampMili) {
  // Create a Date object with the local Unix timestamp and local timezone
  return DateTime.fromMillis(localUnixTimestampMili, { zone: 'UTC' }).setZone('Europe/Lisbon', { keepLocalTime: true }).toUTC().toUnixInteger();
}

/* * */

module.exports.all = async (request, reply) => {
  // Fetch all vehicles
  const allVehiclesData = await PCGIAPI.request('vehiclelocation/vehiclePosition/mapVehicles');
  // Keep only vehicles that match conditions
  const allVehiclesFiltered = allVehiclesData.filter((vehicle) => {
    return true;
    const vehicleIsInTrip = vehicle.Ss === 'STARTED' || vehicle.Ss === 'RUNNING';
    return vehicleIsInTrip;
  });
  // Map to API format
  const allVehiclesFormatted = allVehiclesFiltered.map((vehicle) => {
    return {
      id: vehicle.Vid,
      lat: vehicle.Lat,
      lon: vehicle.Lng,
      speed: vehicle.Spd,
      status: vehicle.Ss,
      timestamp: convertToUTC(vehicle.Ts),
      heading: vehicle.Coa,
      trip_id: vehicle.Lna,
      pattern_id: vehicle.Lna?.substring(0, 8),
    };
  });
  // Return response
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(allVehiclesFormatted || []);
};
