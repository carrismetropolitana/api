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
  const response = await PCGIAPI.request(`opcoremanager/stop-schedules/${request.params.code}`);
  const result = response.map((estimate) => {
    return {
      line_code: estimate.lineId,
      pattern_code: estimate.patternId,
      trip_code: estimate.tripId,
      headsign: estimate.tripHeadsign,
      scheduled_arrival: estimate.scheduledArrivalTime || estimate.arrivalTime,
      estimated_arrival: estimate.estimatedArrivalTime,
      observed_arrival: estimate.observedArrivalTime,
      vehicle_code: estimate.observedVehicleId,
    };
  });
  return reply.send(result || []);
};
