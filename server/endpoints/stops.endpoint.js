/* * */

const SERVERDB = require('../services/SERVERDB');
const PCGIAPI = require('../services/PCGIAPI');
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
      scheduled_arrival_raw: estimate.stopScheduledArrivalTime || estimate.stopScheduledDepartureTime,
      scheduled_arrival_unix: convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopScheduledArrivalTime) || convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopScheduledDepartureTime),
      estimated_arrival: convertTimeStringTo25Hours(estimate.stopArrivalEta) || convertTimeStringTo25Hours(estimate.stopDepartureEta),
      estimated_arrival_raw: estimate.stopArrivalEta || estimate.stopDepartureEta,
      estimated_arrival_unix: convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopArrivalEta) || convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopDepartureEta),
      observed_arrival: convertTimeStringTo25Hours(estimate.stopObservedArrivalTime) || convertTimeStringTo25Hours(estimate.stopObservedDepartureTime),
      observed_arrival_raw: estimate.stopObservedArrivalTime || estimate.stopObservedDepartureTime,
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

function convert24HourPlusOperationTimeStringToUnixTimestamp(operationTimeString) {
  //
  if (!operationTimeString) return null;

  // Start by extracting the components of the timestring
  const [hoursOperation, minutesOperation, secondsOperation] = operationTimeString.split(':').map(Number);

  // If the hours are greater than 24, then subtract 24 hours
  const hoursConverted = hoursOperation >= 24 ? hoursOperation - 24 : hoursOperation;
  const minutesConverted = minutesOperation;
  const secondsConverted = secondsOperation;

  const theDateObject = DateTime.local({ zone: 'Europe/Lisbon' });

  // If the current server time (now) is between 00 and 04, then consider the datetime object as the day before
  if (theDateObject.hour >= 0 && theDateObject.hour < 4) theDateObject.set({ day: theDateObject.day - 1 });

  // Now set the date components
  theDateObject.set({ hour: hoursConverted, minute: minutesConverted, second: secondsConverted });

  // If the hours are greater than or equal to 24, add a day
  if (hoursOperation >= 24) theDateObject.plus({ days: 1 });

  const unixTimestampUtc = theDateObject.toUTC().toUnixInteger();

  // Create a Date object with the local Unix timestamp and local timezone
  return unixTimestampUtc;

  //
}
