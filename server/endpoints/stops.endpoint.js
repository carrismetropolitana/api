//

const SERVERDB = require('../services/SERVERDB');
const PCGIAPI = require('../services/PCGIAPI');

const regexPattern = /^\d{6}$/; // String with exactly 6 numeric digits

//
module.exports.all = async (request, reply) => {
  const foundManyDocuments = await SERVERDB.Stop.find().lean();
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  foundManyDocuments.sort((a, b) => collator.compare(a.code, b.code));
  return reply.send(foundManyDocuments || []);
};

//
module.exports.single = async (request, reply) => {
  if (!regexPattern.test(request.params.code)) return reply.status(400).send([]);
  const foundOneDocument = await SERVERDB.Stop.findOne({ code: { $eq: request.params.code } }).lean();
  return reply.send(foundOneDocument || {});
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
      scheduled_arrival: estimate.stopScheduledArrivalTime || estimate.stopScheduledDepartureTime,
      estimated_arrival: estimate.stopArrivalEta || estimate.stopDepartureEta,
      observed_arrival: estimate.stopObservedArrivalTime || estimate.stopObservedDepartureTime,
      vehicle_code: estimate.observedVehicleId,
    };
  });
  return reply.send(result || []);
};
