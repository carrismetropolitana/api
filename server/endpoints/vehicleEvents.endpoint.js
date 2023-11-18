//

const { DateTime } = require('luxon');
const PCGIAPI = require('../services/PCGIAPI_prod');
const protobuf = require('protobufjs');
const gtfsRealtime = protobuf.loadSync(`${process.env.PWD}/services/gtfs-realtime.proto`);

function convertToUTC(localUnixTimestampMili) {
  // Create a Date object with the local Unix timestamp and local timezone
  return DateTime.fromMillis(localUnixTimestampMili, { zone: 'UTC' }).setZone('Europe/Lisbon', { keepLocalTime: true }).toUTC().toUnixInteger();
}

function getLocalTimeString() {
  // Create a Date object with the local Unix timestamp and local timezone
  return DateTime.now().setZone('Europe/Lisbon').minus({ minutes: 5 }).toFormat('yyyyLLddHHmm');
}

//
//
module.exports.protobuf = async (request, reply) => {
  //

  console.log('getLocalTimeString()', getLocalTimeString());

  const formData = new URLSearchParams();
  formData.append('limit', '10000');
  formData.append('operatorId', '');
  formData.append('vehicleId', '');
  formData.append('timeRange', getLocalTimeString()); // agora menos 5 minutos

  // Get all events from the last hour
  const allVehicleEvents = await PCGIAPI.request('opcoreconsole/vehicle-events/filtered', {
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    body: formData,
  });

  console.log('allVehicleEvents', allVehicleEvents);

  // Parse the json

  const rtFeed = {
    header: {
      gtfsRealtimeVersion: '2.0',
      incrementality: 'FULL_DATASET',
      timestamp: DateTime.now().toUnixInteger(),
    },
    entity: [],
  };

  console.log('DateTime.now().toUnixInteger()', DateTime.now().toUnixInteger());

  const seenVehicles = new Map();

  // Parse the json

  for (const event of allVehicleEvents) {
    //

    // If there is already a vehicle and if that vehicle has an older timestamp
    if (seenVehicles[event.content.entity[0].vehicle.vehicle.id] && seenVehicles[event.content.entity[0].vehicle.vehicle.id].vehicle.timestamp > event.content.entity[0].vehicle.vehicle.id) continue;

    if (!event.content.entity[0].vehicle.trip?.tripId?.length) continue;

    console.log('event.content.entity[0].vehicle.trip', event.content.entity[0].vehicle.trip);

    seenVehicles.set(event.content.entity[0].vehicle.vehicle.id, {
      id: `${event.content.entity[0].vehicle.agencyId}|${event.content.entity[0].vehicle.vehicle.id}-${event.content.entity[0].vehicle.trip.tripId}`,
      vehicle: {
        trip: {
          tripId: event.content.entity[0].vehicle.trip.tripId,
          routeId: event.content.entity[0].vehicle.trip.routeId,
          scheduleRelationship: event.content.entity[0].vehicle.trip.scheduleRelationship,
        },
        vehicle: {
          id: event.content.entity[0].vehicle.vehicle.id,
        },
        position: {
          latitude: event.content.entity[0].vehicle.position.latitude,
          longitude: event.content.entity[0].vehicle.position.longitude,
          bearing: event.content.entity[0].vehicle.position.bearing,
          speed: event.content.entity[0].vehicle.position.speed / 3.6,
        },
        stopId: event.content.entity[0].vehicle.stopId,
        currentStatus: event.content.entity[0].vehicle.currentStatus,
        timestamp: event.content.entity[0].vehicle.timestamp,
      },
    });
  }

  console.log('------------');
  console.log('seenVehicles', seenVehicles);
  console.log('------------');
  console.log('Array.from(seenVehicles.values())', Array.from(seenVehicles.values()));
  console.log('rtFeed.entity antes', rtFeed.entity);

  rtFeed.entity = Array.from(seenVehicles.values());

  console.log('------------');
  console.log('rtFeed.entity depois', rtFeed.entity);

  //
  //
  //

  // Do the conversion to PB

  const FeedMessage = gtfsRealtime.root.lookupType('transit_realtime.FeedMessage');
  const message = FeedMessage.fromObject(rtFeed);
  const buffer = FeedMessage.encode(message).finish();
  return reply.send(buffer);
};
