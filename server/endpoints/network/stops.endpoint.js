/* * */

const SERVERDB = require('../../services/SERVERDB');
const PCGIAPI = require('../../services/PCGIAPI');
const { DateTime } = require('luxon');

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
  // TEMPORARY DISABLE
  return reply.code(503).header('Content-Type', 'application/json; charset=utf-8').send([]);
  //
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
      scheduled_arrival: estimate.stopScheduledArrivalTime || estimate.stopScheduledDepartureTime,
      scheduled_arrival_unix: convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopScheduledArrivalTime) || convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopScheduledDepartureTime),
      estimated_arrival: estimate.stopArrivalEta || estimate.stopDepartureEta,
      estimated_arrival_unix: convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopArrivalEta) || convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopDepartureEta),
      observed_arrival: estimate.stopObservedArrivalTime || estimate.stopObservedDepartureTime,
      observed_arrival_unix: convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopObservedArrivalTime) || convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopObservedDepartureTime),
      vehicle_id: estimate.observedVehicleId,
    };
  });
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(result || []);
};

/* * */

function convert24HourPlusOperationTimeStringToUnixTimestamp(operationTimeString) {
  //

  // Return early if no time string is provided
  if (!operationTimeString) return null;

  // Extract the individual components of the time string (HH:MM:SS)
  const [hoursOperation, minutesOperation, secondsOperation] = operationTimeString.split(':').map(Number);

  // Because the operational time string can be greater than 24 (expressing an operational day after midnight, or longer),
  // calculate how many days are in the hour component, and how many hours are left after the parsing
  const daysInTheHourComponent = Math.floor(hoursOperation / 24);
  const hoursLeftAfterDayConversion = hoursOperation % 24;

  // Setup a new DateTime (luxon) object
  let theDateTimeObject = DateTime.local({ zone: 'Europe/Lisbon' });

  // Since this is a on-the-fly conversion, there is the case where the server time will be between 00 and 04,
  // in which case we need to set the DateTime object as the day before, before applying the actual time component calculations
  if (theDateTimeObject.hour >= 0 && theDateTimeObject.hour < 4) theDateTimeObject = theDateTimeObject.set({ day: theDateTimeObject.day - 1 });

  // Apply the date components previously calculated
  theDateTimeObject = theDateTimeObject.set({
    hour: hoursLeftAfterDayConversion,
    minute: minutesOperation,
    second: secondsOperation,
  });

  // If the time string represents a service in another day (but in the same operational day),
  // add the corresponding amount of days to the DateTime object
  if (daysInTheHourComponent > 0) theDateTimeObject = theDateTimeObject.plus({ days: daysInTheHourComponent });

  // Return the DateTime object as a Unix timestamp in the UTC timezone
  return theDateTimeObject.toUTC().toUnixInteger();

  //
}
