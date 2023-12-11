/* * */

const { DateTime } = require('luxon');
const PCGIAPI = require('./PCGIAPI');

/* * */

class RTEVENTS {
  //

  constructor() {
    this.last_update = null;
    this.rt_events = new Map();
  }

  /* * *
   * UPDATE ALL EVENTS
   */

  async update() {
    //
    // 1.
    // Skip if last update happened in the past 20 seconds
    if (this.last_update > DateTime.now().minus({ seconds: 20 }).toUnixInteger()) return;

    // 2.
    // Prepare the request to PCGI to get all events received in the last 5 minutes
    const formData = new URLSearchParams();
    formData.append('timeRange', DateTime.now().setZone('Europe/Lisbon').minus({ minutes: 5 }).toFormat('yyyyLLddHHmm'));

    // 3.
    // Perform the request to PCGI
    const allRtEvents = await PCGIAPI.request('opcoreconsole/vehicle-events/filtered', {
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      body: formData,
    });

    // 4.
    // Set the current time to the last_update flag to avoid over fetching
    this.last_update = DateTime.now().toUnixInteger();

    // 5.
    // Reset the Map variable
    const updatedRtEvents = new Map();

    // 6.
    // Update vehicles with the latest events
    for (const rtEvent of allRtEvents) {
      //
      // 6.1.
      // Perform basic event validations

      // Does this event has a valid vehicle id
      if (!rtEvent?.content?.entity[0]?.vehicle?.vehicle?.id?.length) continue;
      // Does this event has a valid agency id
      if (!rtEvent?.content?.entity[0]?.vehicle?.agencyId?.length) continue;
      // Does this event has an associated trip
      if (!rtEvent?.content?.entity[0]?.vehicle?.trip?.tripId?.length) continue;
      // Does this event has a valid latitude and longitude
      if (!Math.floor(rtEvent?.content?.entity[0]?.vehicle?.position?.latitude) || !Math.floor(rtEvent?.content?.entity[0]?.vehicle?.position?.longitude)) continue;
      // Is this event older than 90 seconds
      if (rtEvent?.content?.entity[0]?.vehicle?.timestamp > DateTime.now().minus({ seconds: 90 }).toUnixInteger()) continue;

      // 6.2.
      // Prepare the most used variables
      const vehicleId = `${rtEvent.content.entity[0].vehicle.agencyId}|${rtEvent.content.entity[0].vehicle.vehicle.id}`;
      const vehicleTimestamp = rtEvent.content.entity[0].vehicle.timestamp;
      const vehicleTripId = rtEvent.content.entity[0].vehicle.trip.tripId;
      const vehicleBearing = Math.floor(rtEvent?.content?.entity[0]?.vehicle?.position?.bearing || 0);
      const vehicleSpeed = rtEvent?.content?.entity[0]?.vehicle?.position?.speed / 3.6 || 0; // in meters per second

      // 6.3.
      // Check if there is a vehicle already saved and that it has an older timestamp than the current event
      if (this.rt_events[vehicleId] && this.rt_events[vehicleId].timestamp >= vehicleTimestamp) continue;

      // 6.4.
      // Save the current event
      updatedRtEvents.set(vehicleId, {
        // The vehicle ID is composed of the agency_id and the vehicle_id
        vehicle_id: vehicleId,
        // Event ID should be kept stable for the duration of a single trip
        event_id: `${vehicleId}-${vehicleTripId}`,
        // Timestamp is in UTC
        timestamp: vehicleTimestamp,
        // Current status can be 'IN_TRANSIT_TO', 'INCOMMING_AT' or 'STOPPED_AT' at the current stop_id
        current_status: rtEvent.content.entity[0].vehicle.currentStatus,
        // Schedule relationship can be SCHEDULED for planned trips or ADDED for new trips created by the driver
        schedule_relationship: rtEvent.content.entity[0].vehicle.trip.scheduleRelationship === 'SCHEDULED' ? 'SCHEDULED' : 'DUPLICATED',
        // Trip ID, route ID and stop ID should always be a known entity in the scheduled GTFS
        trip_id: vehicleTripId,
        route_id: rtEvent.content.entity[0].vehicle.trip.routeId,
        stop_id: rtEvent.content.entity[0].vehicle.stopId,
        //
        latitude: rtEvent.content.entity[0].vehicle.position.latitude,
        longitude: rtEvent.content.entity[0].vehicle.position.longitude,
        //
        bearing: vehicleBearing,
        speed: vehicleSpeed,
        //
      });

      //
    }

    // 7.
    // Save the updated Map to memory
    this.rt_events = updatedRtEvents;

    //
  }

  /* * *
   * PROTOCOL BUFFERS
   */

  async protobuf() {
    //

    //
    // 1. Request an update of the events

    await this.update();

    //
    // 2. Prepare the feed header

    const feed = {
      header: {
        gtfsRealtimeVersion: '2.0',
        incrementality: 'FULL_DATASET',
        timestamp: DateTime.now().toUnixInteger(),
      },
      entity: [],
    };

    //
    // 3. Prepare the entities array

    feed.entity = Array.from(this.rt_events.values()).map((savedEvent) => ({
      id: savedEvent.event_id,
      vehicle: {
        trip: {
          tripId: savedEvent.trip_id,
          routeId: savedEvent.route_id,
          scheduleRelationship: savedEvent.schedule_relationship,
        },
        vehicle: {
          id: savedEvent.vehicle_id,
        },
        position: {
          latitude: savedEvent.latitude,
          longitude: savedEvent.longitude,
          bearing: savedEvent.bearing,
          speed: savedEvent.speed,
        },
        stopId: savedEvent.stop_id,
        currentStatus: savedEvent.current_status,
        timestamp: savedEvent.timestamp,
      },
    }));

    //
    // 4. Return the feed to the caller

    return feed;

    //
  }

  /* * *
   * JSON
   */

  async json() {
    //

    //
    // 1. Request an update of the events

    await this.update();

    //
    // 2. Return the formatted result

    return Array.from(this.rt_events.values()).map((savedEvent) => ({
      id: savedEvent.vehicle_id,
      lat: savedEvent.latitude,
      lon: savedEvent.longitude,
      speed: savedEvent.speed,
      bearing: vehicle.bearing,
      timestamp: savedEvent.timestamp,
      trip_id: savedEvent.trip_id,
      pattern_id: savedEvent.trip_id?.substring(0, 8),
      stop_id: savedEvent.stop_id,
      //
      status: 'DEPRECATED PROPERTY', // deprecated
      heading: vehicle.bearing, // deprecated
    }));

    //
  }

  //
}

module.exports = new RTEVENTS();
