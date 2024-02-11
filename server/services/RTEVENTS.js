/* * */

const { DateTime } = require('luxon');
const REALTIMEDB = require('./REALTIMEDB');

/* * */

class RTEVENTS {
  //

  last_update = null;

  rt_events = new Map();

  /* * *
   * UPDATE ALL EVENTS
   */

  async update() {
    //

    // 1.
    // Skip if last update happened in the past 20 seconds

    if (this.last_update > DateTime.now().minus({ seconds: 20 }).toUnixInteger()) return;

    // 2.
    // Fetch latest events

    const allRtEvents = await REALTIMEDB.VehicleEvents.find({
      millis: {
        $gte: DateTime.now().setZone('Europe/Lisbon').minus({ minutes: 5 }).toMillis(),
      },
    })
      .sort({ millis: 1 })
      .limit(50000)
      .toArray();

    // 3.
    // Set the current time to the last_update flag to avoid over fetching

    this.last_update = DateTime.now().toUnixInteger();

    // 4.
    // Reset the Map variable

    const updatedRtEvents = new Map();

    // 5.
    // Update vehicles with the latest events

    for (const rtEvent of allRtEvents) {
      //

      // 5.1.
      // Perform basic event validations

      // Does this event has a valid vehicle id
      if (!rtEvent.content?.entity[0]?.vehicle?.vehicle?._id?.length) continue;
      // Does this event has a valid agency id
      if (!rtEvent.content?.entity[0]?.vehicle?.agencyId?.length) continue;
      // Does this event has an associated trip
      if (!rtEvent.content?.entity[0]?.vehicle?.trip?.tripId?.length) continue;
      // Does this event has a valid latitude and longitude
      if (!Math.floor(rtEvent?.content?.entity[0]?.vehicle?.position?.latitude) || !Math.floor(rtEvent?.content?.entity[0]?.vehicle?.position?.longitude)) continue;
      // Skip if the trip is not scheduled
      if (rtEvent.content?.entity[0]?.vehicle?.trip?.scheduleRelationship !== 'SCHEDULED') continue;
      // Skip if the route id is excessively long
      if (rtEvent.content?.entity[0]?.vehicle?.trip?.routeId?.length > 8) continue;
      // Skip if the stop id is not 6 digits
      if (rtEvent.content?.entity[0]?.vehicle?.stopId.length !== 6) continue;
      // Is this event older than 90 seconds
      if (rtEvent?.content?.entity[0]?.vehicle?.timestamp < DateTime.now().minus({ seconds: 90 }).toUnixInteger()) continue;

      // 5.2.
      // Prepare the most used variables

      const vehicleId = `${rtEvent.content.entity[0].vehicle.agencyId}|${rtEvent.content.entity[0].vehicle.vehicle._id}`;
      const vehicleTimestamp = rtEvent.content.entity[0].vehicle.timestamp;
      const vehicleTripId = rtEvent.content.entity[0].vehicle.trip.tripId;
      const vehicleBearing = Math.floor(rtEvent?.content?.entity[0]?.vehicle?.position?.bearing || 0);
      const vehicleSpeed = rtEvent?.content?.entity[0]?.vehicle?.position?.speed / 3.6 || 0; // in meters per second

      // 5.3.
      // Check if there is a vehicle already saved and that it has an older timestamp than the current event
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('vehicleId', vehicleId);
      console.log('this.rt_events[vehicleId].timestamp', this.rt_events[vehicleId].timestamp);
      console.log('vehicleTimestamp', vehicleTimestamp);
      console.log('this.rt_events[vehicleId].timestamp >= vehicleTimestamp', this.rt_events[vehicleId].timestamp >= vehicleTimestamp);
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');

      if (this.rt_events[vehicleId] && this.rt_events[vehicleId].timestamp >= vehicleTimestamp) continue;

      // 5.4.
      // Save the current event

      updatedRtEvents.set(vehicleId, {
        // The vehicle ID is composed of the agency_id and the vehicle_id
        vehicle_id: vehicleId,
        // Event ID should be kept stable for the duration of a single trip
        event_id: `${vehicleId}-${vehicleTripId}`,
        // Timestamp is in UTC
        timestamp: vehicleTimestamp,
        // Schedule relationship can be SCHEDULED for planned trips or ADDED for new trips created by the driver
        schedule_relationship: rtEvent.content.entity[0].vehicle.trip.scheduleRelationship === 'SCHEDULED' ? 'SCHEDULED' : 'DUPLICATED',
        // Trip ID, Pattern ID, Route ID and Line ID should always be known entities in the scheduled GTFS
        trip_id: vehicleTripId,
        pattern_id: rtEvent.content.entity[0].vehicle.trip.patternId,
        route_id: rtEvent.content.entity[0].vehicle.trip.routeId,
        line_id: rtEvent.content.entity[0].vehicle.trip.lineId,
        // The stop the vehicle is serving at the moment
        stop_id: rtEvent.content.entity[0].vehicle.stopId,
        // Current status can be 'IN_TRANSIT_TO', 'INCOMMING_AT' or 'STOPPED_AT' at the current stop_id
        current_status: rtEvent.content.entity[0].vehicle.currentStatus,
        //
        block_id: rtEvent.content.entity[0].vehicle.vehicle.blockId,
        shift_id: rtEvent.content.entity[0].vehicle.vehicle.shiftId,
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

    // 6.
    // Save the updated Map to memory

    this.rt_events = updatedRtEvents;

    //
  }

  /* * *
   * PROTOCOL BUFFERS
   */

  async protobuf() {
    //

    // 1.
    // Request an update of the events

    await this.update();

    // 2.
    // Prepare the feed header

    const feed = {
      header: {
        gtfsRealtimeVersion: '2.0',
        incrementality: 'FULL_DATASET',
        timestamp: DateTime.now().toUnixInteger(),
      },
      entity: [],
    };

    // 3.
    // Prepare the entities array

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

    // 4.
    // Return the feed to the caller

    return feed;

    //
  }

  /* * *
   * JSON
   */

  async json() {
    //

    // 1.
    // Request an update of the events

    await this.update();

    // 2.
    // Return the formatted result

    return Array.from(this.rt_events.values()).map((savedEvent) => ({
      //
      id: savedEvent.vehicle_id,
      //
      timestamp: savedEvent.timestamp,
      //
      schedule_relationship: savedEvent.schedule_relationship,
      //
      trip_id: savedEvent.trip_id,
      pattern_id: savedEvent.pattern_id,
      route_id: savedEvent.route_id,
      line_id: savedEvent.line_id,
      //
      stop_id: savedEvent.stop_id,
      current_status: savedEvent.current_status,
      //
      block_id: savedEvent.block_id,
      shift_id: savedEvent.shift_id,
      //
      lat: savedEvent.latitude,
      lon: savedEvent.longitude,
      //
      bearing: savedEvent.bearing,
      speed: savedEvent.speed,
      ////
      status: 'REPLACED BY current_status', // deprecated
      heading: 0, // deprecated
      //
    }));

    //
  }

  //
}

/* * */

module.exports = new RTEVENTS();
