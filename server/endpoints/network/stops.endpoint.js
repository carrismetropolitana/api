/* * */

const SERVERDB = require('../../services/SERVERDB');
const PCGIAPI = require('../../services/PCGIAPI');
const { DateTime } = require('luxon');

/* * */

const regexPatternForStopId = /^\d{6}$/; // String with exactly 6 numeric digits

/* * */

module.exports.all = async (request, reply) => {
  const allItems = await SERVERDB.client.get('stops:all');
  reply.header('Content-Type', 'application/json');
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(allItems || '[]');
};

/* * */

module.exports.single = async (request, reply) => {
  if (!regexPatternForStopId.test(request.params.id)) return reply.status(400).send([]);
  const singleItem = await SERVERDB.client.get(`stops:${request.params.id}`);
  reply.header('Content-Type', 'application/json');
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(singleItem || '{}');
};

/* * */

module.exports.singleWithRealtime = async (request, reply) => {
  //
  //   return reply.code(503).send([]);
  //
  if (!regexPatternForStopId.test(request.params.id)) return reply.status(400).send([]);
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

module.exports.realtimeForPips = async (request, reply) => {
  // Validate request body
  if (!request.body?.stops || request.body.stops.length === 0) return reply.code(400).send([]);
  // Validate each requested Stop ID
  for (const stopId of request.body.stops) {
    if (!regexPatternForStopId.test(stopId)) return reply.status(400).send([]);
    if (stopId === '000000') {
      return reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send([
          {
            lineId: '0000',
            patternId: '0000_0_0',
            stopHeadsign: 'Olá :)',
            journeyId: '0000_0_0|teste',
            timetabledArrivalTime: '23:59:59',
            timetabledDepartureTime: '23:59:59',
            estimatedArrivalTime: '23:59:59',
            estimatedDepartureTime: '23:59:59',
            observedArrivalTime: null,
            observedDepartureTime: null,
            observedVehicleId: '0000',
            stopId: '', // Deprecated
            operatorId: '', // Deprecated
            observedDriverId: '', // Deprecated
          },
        ]);
    }
  }
  // Parse requested stop into a comma-separated list
  const stopIdsList = request.body.stops.join(',');
  // Fetch the estimates for this stop list
  const response = await PCGIAPI.request(`opcoreconsole/rt/stop-etas/${stopIdsList}`);
  // Parse the result into the expected PIP style
  const result = response
    .filter((estimate) => {
      // Check if this estimate has all required fields
      const hasScheduledTime = (estimate.stopScheduledArrivalTime !== null && estimate.stopScheduledArrivalTime !== undefined) || (estimate.stopScheduledDepartuteTime !== null && estimate.stopScheduledDepartuteTime !== undefined);
      const hasEstimatedTime = (estimate.stopArrivalEta !== null && estimate.stopArrivalEta !== undefined) || (estimate.stopDepartureEta !== null && estimate.stopDepartureEta !== undefined);
      const hasObservedTime = (estimate.stopObservedArrivalTime !== null && estimate.stopObservedArrivalTime !== undefined) || (estimate.stopObservedDepartureTime !== null && estimate.stopObservedDepartureTime !== undefined);
      // Check if the estimated time for this estimate is in the past
      const estimatedTimeInUnixSeconds = convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopArrivalEta) || convert24HourPlusOperationTimeStringToUnixTimestamp(estimate.stopDepartureEta);
      const isThisEstimateInThePast = estimatedTimeInUnixSeconds < DateTime.local({ zone: 'Europe/Lisbon' }).toUTC().toUnixInteger();
      // Return true only if estimate has scheduled time, estimated time and no observed time, and if the estimated time is in not the past
      return hasScheduledTime && hasEstimatedTime && !hasObservedTime && !isThisEstimateInThePast;
    })
    .map((estimate) => {
      return {
        lineId: estimate.lineId,
        patternId: estimate.patternId,
        stopHeadsign: estimate.tripHeadsign,
        journeyId: estimate.tripId,
        timetabledArrivalTime: estimate.stopArrivalEta || estimate.stopDepartureEta,
        timetabledDepartureTime: estimate.stopArrivalEta || estimate.stopDepartureEta,
        estimatedArrivalTime: estimate.stopArrivalEta || estimate.stopDepartureEta,
        estimatedDepartureTime: estimate.stopArrivalEta || estimate.stopDepartureEta,
        observedArrivalTime: estimate.stopObservedArrivalTime || estimate.stopObservedDepartureTime,
        observedDepartureTime: estimate.stopObservedArrivalTime || estimate.stopObservedDepartureTime,
        observedVehicleId: estimate.observedVehicleId,
        stopId: '', // Deprecated
        operatorId: '', // Deprecated
        observedDriverId: '', // Deprecated
      };
    });
  if (result.lenght > 0) {
    return reply
      .code(200)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(result || []);
  } else {
    return reply
      .code(200)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send([
        {
          lineId: '0000',
          patternId: '0000_0_0',
          stopHeadsign: '-',
          journeyId: '0000_0_0|teste',
          timetabledArrivalTime: '23:59:59',
          timetabledDepartureTime: '23:59:59',
          estimatedArrivalTime: '23:59:59',
          estimatedDepartureTime: '23:59:59',
          observedArrivalTime: null,
          observedDepartureTime: null,
          observedVehicleId: '0000',
          stopId: '', // Deprecated
          operatorId: '', // Deprecated
          observedDriverId: '', // Deprecated
        },
      ]);
  }
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
