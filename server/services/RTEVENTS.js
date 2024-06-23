/* * */

import PCGIDB from '@/services/PCGIDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import { DateTime } from 'luxon';

/* * */

class RTEVENTS {
	//

	last_update = null;

	rt_events = new Map();

	/* * *
	 * UPDATE ALL EVENTS
	 */

	async json() {
		//

		// 1.
		// Request an update of the events

		await this.update();

		// 2.
		// Return the formatted result

		return Array.from(this.rt_events.values()).map(savedEvent => ({
			//
			bearing: savedEvent.bearing,
			//
			block_id: savedEvent.block_id,
			current_status: savedEvent.current_status,
			//
			id: savedEvent.vehicle_id,
			//
			lat: savedEvent.latitude,
			line_id: savedEvent.line_id,
			lon: savedEvent.longitude,
			pattern_id: savedEvent.pattern_id,
			route_id: savedEvent.route_id,
			//
			schedule_relationship: savedEvent.schedule_relationship,
			shift_id: savedEvent.shift_id,
			speed: savedEvent.speed,
			//
			stop_id: savedEvent.stop_id,
			//
			timestamp: savedEvent.timestamp,
			//
			trip_id: savedEvent.trip_id,
			//
		}));

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
			entity: [],
			header: {
				gtfsRealtimeVersion: '2.0',
				incrementality: 'FULL_DATASET',
				timestamp: DateTime.now().toUnixInteger(),
			},
		};

		// 3.
		// Prepare the entities array

		feed.entity = Array.from(this.rt_events.values()).map(savedEvent => ({
			id: savedEvent.event_id,
			vehicle: {
				currentStatus: savedEvent.current_status,
				position: {
					bearing: savedEvent.bearing,
					latitude: savedEvent.latitude,
					longitude: savedEvent.longitude,
					speed: savedEvent.speed,
				},
				stopId: savedEvent.stop_id,
				timestamp: savedEvent.timestamp,
				trip: {
					routeId: savedEvent.route_id,
					scheduleRelationship: savedEvent.schedule_relationship,
					tripId: savedEvent.trip_id,
				},
				vehicle: {
					id: savedEvent.vehicle_id,
				},
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

	async update() {
		//

		// 1.
		// Skip if last update happened in the past 20 seconds

		if (this.last_update > DateTime.now().minus({ seconds: 20 }).toUnixInteger()) return;

		// 2.
		// Connect to the database

		await PCGIDB.connect();

		// 3.
		// Fetch latest events

		const allRtEvents = await PCGIDB.VehicleEvents.find({
			millis: {
				$gte: DateTime.now().minus({ minutes: 5 }).toMillis(),
			},
		}).toArray();

		// 4.
		// Set the current time to the last_update flag to avoid over fetching

		this.last_update = DateTime.now().toUnixInteger();

		// 5.
		// Get all archives from SERVERDB to find out what is the active archive_id for each operator

		const currentArchiveIds = {};

		const allArchivesTxt = await SERVERDB.client.get('archives:all');
		const allArchivesData = JSON.parse(allArchivesTxt);

		for (const archiveData of allArchivesData) {
			const archiveStartDate = DateTime.fromFormat(archiveData.start_date, 'yyyyMMdd');
			const archiveEndDate = DateTime.fromFormat(archiveData.end_date, 'yyyyMMdd');
			if (archiveStartDate > DateTime.now() || archiveEndDate < DateTime.now()) continue;
			else currentArchiveIds[archiveData.operator_id] = archiveData.id;
		}

		// 6.
		// Reset the Map variable

		const updatedRtEvents = new Map();

		// 7.
		// Update vehicles with the latest events

		for (const rtEvent of allRtEvents) {
			//

			// 7.1.
			// Perform basic event validations

			// Does this event have a valid vehicle id
			if (!rtEvent.content?.entity[0]?.vehicle?.vehicle?._id?.length) continue;
			// Does this event have a valid agency id
			if (!rtEvent.content?.entity[0]?.vehicle?.agencyId?.length) continue;
			// Does this event have an associated trip
			if (!rtEvent.content?.entity[0]?.vehicle?.trip?.tripId?.length) continue;
			// Does this event have a valid latitude and longitude
			if (!Math.floor(rtEvent?.content?.entity[0]?.vehicle?.position?.latitude) || !Math.floor(rtEvent?.content?.entity[0]?.vehicle?.position?.longitude)) continue;
			// Skip if the trip is not scheduled
			if (rtEvent.content?.entity[0]?.vehicle?.trip?.scheduleRelationship !== 'SCHEDULED') continue;
			// Skip if the route id is excessively long
			if (rtEvent.content?.entity[0]?.vehicle?.trip?.routeId?.length > 8) continue;
			// Skip if the stop id is not 6 digits
			if (rtEvent.content?.entity[0]?.vehicle?.stopId.length !== 6) continue;
			// Is this event older than 90 seconds
			if (rtEvent?.content?.entity[0]?.vehicle?.timestamp < DateTime.now().minus({ seconds: 90 }).toUnixInteger()) continue;

			// 7.2.
			// Prepare the most used variables

			const vehicleId = `${rtEvent.content.entity[0].vehicle.agencyId}|${rtEvent.content.entity[0].vehicle.vehicle._id}`;
			const vehicleTimestamp = rtEvent.content.entity[0].vehicle.timestamp;
			const vehicleTripId = rtEvent.content.entity[0].vehicle.trip.tripId;
			const vehicleBearing = Math.floor(rtEvent?.content?.entity[0]?.vehicle?.position?.bearing || 0);
			const vehicleSpeed = rtEvent?.content?.entity[0]?.vehicle?.position?.speed / 3.6 || 0; // in meters per second

			// 7.3.
			// Check if there is a vehicle already saved and that it has an older timestamp than the current event

			if (updatedRtEvents.get(vehicleId) && updatedRtEvents.get(vehicleId).timestamp >= vehicleTimestamp) continue;

			const operatorId = rtEvent.content?.entity[0]?.vehicle?.agencyId;

			// 7.4.
			// Save the current event

			updatedRtEvents.set(vehicleId, {
				//
				bearing: vehicleBearing,
				//
				block_id: rtEvent.content.entity[0].vehicle.vehicle.blockId,
				// Current status can be 'IN_TRANSIT_TO', 'INCOMMING_AT' or 'STOPPED_AT' at the current stop_id
				current_status: rtEvent.content.entity[0].vehicle.currentStatus,
				// Event ID should be kept stable for the duration of a single trip
				event_id: `${currentArchiveIds[operatorId]}-${vehicleId}-${vehicleTripId}`,
				//
				latitude: rtEvent.content.entity[0].vehicle.position.latitude,
				line_id: rtEvent.content.entity[0].vehicle.trip.lineId,
				longitude: rtEvent.content.entity[0].vehicle.position.longitude,
				pattern_id: rtEvent.content.entity[0].vehicle.trip.patternId,
				route_id: rtEvent.content.entity[0].vehicle.trip.routeId,
				// Schedule relationship can be SCHEDULED for archivened trips or ADDED for new trips created by the driver
				schedule_relationship: rtEvent.content.entity[0].vehicle.trip.scheduleRelationship === 'SCHEDULED' ? 'SCHEDULED' : 'DUPLICATED',
				shift_id: rtEvent.content.entity[0].vehicle.vehicle.shiftId,
				speed: vehicleSpeed,
				// The stop the vehicle is serving at the moment
				stop_id: rtEvent.content.entity[0].vehicle.stopId,
				// Timestamp is in UTC
				timestamp: vehicleTimestamp,
				// Trip ID, Pattern ID, Route ID and Line ID should always be known entities in the scheduled GTFS
				trip_id: `${vehicleTripId}_${currentArchiveIds[operatorId]}`,
				// The vehicle ID is composed of the agency_id and the vehicle_id
				vehicle_id: vehicleId,
				//
			});

			//
		}

		// 7.
		// Save the updated Map to memory

		this.rt_events = updatedRtEvents;

		//
	}

	//
}

/* * */

export default new RTEVENTS();
