/* * */

const SERVERDB = require('../../services/SERVERDB');
const PCGIAPI = require('../../services/PCGIAPI');
const DATES = require('../../services/DATES')

/* * */

module.exports.all = async (request, reply) => {
  // Disabled endpoint
  return reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send([]);
};

/* * */

module.exports.single = async (request, reply) => {
  const singleItem = await SERVERDB.client.get(`patterns:${request.params.id}`);
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(singleItem || {});
};


/* * */

module.exports.realtime = async (request, reply) => {
  console.log('******************')
  console.log('******************')
  console.log('******************')
  const singleItem = await SERVERDB.client.get(`patterns:${request.params.id}`);
  const singleItemJson = await JSON.parse(singleItem);
  const stopIdsForThisPattern = singleItemJson?.path?.map(item => item.stop.id).join(',');
  console.log('******************')
  console.log('******************')
  console.log('******************')
  console.log('request.params.id', request.params.id)
  console.log('******************')
  console.log('******************')
  console.log('******************')
  // console.log('singleItemJson.path', singleItemJson.path)
  console.log('******************')
  console.log('******************')
  console.log('******************')
  console.log('stopIdsForThisPattern', stopIdsForThisPattern)
  console.log('******************')
  console.log('******************')
  console.log('******************')
  const response = await PCGIAPI.request(`opcoreconsole/rt/stop-etas/${stopIdsForThisPattern}`);
  const result = response.map((estimate) => {
    return {
      stop_id: estimate.stopId,
      line_id: estimate.lineId,
      pattern_id: estimate.patternId,
      route_id: estimate.routeId,
      trip_id: estimate.tripId,
      headsign: estimate.tripHeadsign,
      stop_sequence: estimate.stopSequence,
      scheduled_arrival: estimate.stopScheduledArrivalTime || estimate.stopScheduledDepartureTime,
      scheduled_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopScheduledArrivalTime) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopScheduledDepartureTime),
      estimated_arrival: estimate.stopArrivalEta || estimate.stopDepartureEta,
      estimated_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopArrivalEta) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopDepartureEta),
      observed_arrival: estimate.stopObservedArrivalTime || estimate.stopObservedDepartureTime,
      observed_arrival_unix: DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopObservedArrivalTime) || DATES.convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopObservedDepartureTime),
      vehicle_id: estimate.observedVehicleId,
    };
  });
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(result || []);
};