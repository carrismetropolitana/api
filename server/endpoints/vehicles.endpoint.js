//

const { DateTime } = require('luxon');
const PCGIAPI = require('../services/PCGIAPI');

function convertToUTC(localUnixTimestampMili) {
  // Create a Date object with the local Unix timestamp and local timezone
  return DateTime.fromMillis(localUnixTimestampMili, { zone: 'UTC' }).setZone('Europe/Lisbon', { keepLocalTime: true }).toUTC().toUnixInteger();
}

//
module.exports.all = async (request, reply) => {
  const allVehiclesData = await PCGIAPI.request('vehiclelocation/vehiclePosition/mapVehicles');
  const allVehiclesFormatted = allVehiclesData.map((vehicle) => {
    return {
      id: vehicle.Vid,
      lat: vehicle.Lat,
      lon: vehicle.Lng,
      speed: vehicle.Spd,
      timestamp: convertToUTC(vehicle.Ts),
      heading: vehicle.Coa,
      trip_id: vehicle.Lna,
      pattern_id: vehicle.Lna?.substring(0, 8),
    };
  });
  return reply.send(allVehiclesFormatted || []);
};
