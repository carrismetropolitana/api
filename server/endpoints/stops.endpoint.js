//
const SERVERDB = require('../services/SERVERDB');
const PCGIAPI = require('../services/PCGIAPI');

const regexPattern = /^\d{6}$/; // String with exactly 6 numeric digits

//
module.exports.all = async (request, reply) => {
  const allStopsData = await SERVERDB.client.get('stops:all');
  return reply.send(JSON.parse(allStopsData) || []);
};

//
module.exports.single = async (request, reply) => {
  if (!regexPattern.test(request.params.code)) return reply.status(400).send([]);
  const stopData = await SERVERDB.client.get(`stops:${request.params.code}`);
  return reply.send(JSON.parse(stopData) || {});
};

//
module.exports.singleWithRealtime = async (request, reply) => {
  if (!regexPattern.test(request.params.code)) return reply.status(400).send([]);
  const response = await PCGIAPI.request(`opcoreconsole/rt/stop-etas/${request.params.code}`);
  const result = response.map((estimate) => {
    return {
      line_code: estimate.lineId,
      pattern_code: estimate.patternId,
      route_code: estimate.routeId,
      trip_code: estimate.tripId,
      headsign: estimate.tripHeadsign,
      stop_sequence: estimate.stopSequence,
      scheduled_arrival: convertTimeStringTo25Hours(estimate.stopScheduledArrivalTime) || convertTimeStringTo25Hours(estimate.stopScheduledDepartureTime),
      estimated_arrival: convertTimeStringTo25Hours(estimate.stopArrivalEta) || convertTimeStringTo25Hours(estimate.stopDepartureEta),
      observed_arrival: convertTimeStringTo25Hours(estimate.stopObservedArrivalTime) || convertTimeStringTo25Hours(estimate.stopObservedDepartureTime),
      vehicle_code: estimate.observedVehicleId,
    };
  });
  return reply.send(result || []);
};

function convertTimeStringTo25Hours(timeString) {
  const hoursString = timeString.substring(0, 1);
  const hoursInt = parseInt(hoursString);
  if (hoursInt < 4) {
    const hoursInt25 = hoursInt + 24;
    const hoursString25 = String(hoursInt25).padStart(2, '0');
    return `${hoursString25}${timeString.substring(2)}`;
  }
  return timeString;
}
