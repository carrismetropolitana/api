/* * */

const SERVERDB = require('../services/SERVERDB');
const PCGIAPI = require('../services/PCGIAPI');

/* * */

const regexPattern = /^\d{6}$/; // String with exactly 6 numeric digits

/* * */

module.exports.all = async (request, reply) => {
  const allItems = await SERVERDB.client.get('stops:all');
  reply.header('Content-Type', 'application/json');
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(allItems || '[]');
};

module.exports.single = async (request, reply) => {
  if (!regexPattern.test(request.params.id)) return reply.status(400).send([]);
  const singleItem = await SERVERDB.client.get(`stops:${request.params.id}`);
  reply.header('Content-Type', 'application/json');
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(singleItem || '{}');
};

module.exports.singleWithRealtime = async (request, reply) => {
  if (!regexPattern.test(request.params.id)) return reply.status(400).send([]);
  const response = await PCGIAPI.request(`opcoreconsole/rt/stop-etas/${request.params.id}`);
  const result = response.map((estimate) => {
    return {
      line_id: estimate.lineId,
      pattern_id: estimate.patternId,
      route_id: estimate.routeId,
      trip_id: estimate.tripId,
      headsign: estimate.tripHeadsign,
      stop_sequence: estimate.stopSequence,
      scheduled_arrival: convertTimeStringTo25Hours(estimate.stopScheduledArrivalTime) || convertTimeStringTo25Hours(estimate.stopScheduledDepartureTime),
      estimated_arrival: convertTimeStringTo25Hours(estimate.stopArrivalEta) || convertTimeStringTo25Hours(estimate.stopDepartureEta),
      observed_arrival: convertTimeStringTo25Hours(estimate.stopObservedArrivalTime) || convertTimeStringTo25Hours(estimate.stopObservedDepartureTime),
      vehicle_id: estimate.observedVehicleId,
    };
  });
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(result || []);
};

/* * */

function convertTimeStringTo25Hours(timeString) {
  if (!timeString) return;
  const hoursString = timeString.substring(0, 2);
  const hoursInt = parseInt(hoursString);
  if (hoursInt < 4) {
    const hoursInt25 = hoursInt + 24;
    const hoursString25 = String(hoursInt25).padStart(2, '0');
    return `${hoursString25}${timeString.substring(2)}`;
  }
  return timeString;
}
