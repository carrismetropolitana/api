/* * */

import PCGIDB from '@/services/PCGIDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { DateTime } from 'luxon';
import protobufjs from 'protobufjs';

/* * */

const gtfsRealtime = protobufjs.loadSync(`${process.env.PWD}/services/gtfs-realtime.proto`);

/* * */

function convertToJson(allEvents) {
	return allEvents.map(event => ({
		bearing: event.bearing,
		block_id: event.block_id,
		current_status: event.current_status,
		direction_id: event.direction_id,
		id: event.vehicle_id,
		lat: event.latitude,
		line_id: event.line_id,
		lon: event.longitude,
		pattern_id: event.pattern_id,
		route_id: event.route_id,
		schedule_relationship: event.schedule_relationship,
		shift_id: event.shift_id,
		speed: event.speed,
		stop_id: event.stop_id,
		timestamp: event.timestamp,
		trip_id: event.trip_id,
	}));
}

/* * */

function convertToProtobuf(allEvents) {
	//
	const allEventsPb = {
		entity: allEvents.map(event => ({
			id: event.event_id,
			vehicle: {
				currentStatus: event.current_status,
				position: {
					bearing: event.bearing,
					latitude: event.latitude,
					longitude: event.longitude,
					speed: event.speed,
				},
				stopId: event.stop_id,
				timestamp: event.timestamp,
				trip: {
					directionId: event.direction_id,
					routeId: event.route_id,
					scheduleRelationship: event.schedule_relationship,
					tripId: event.trip_id,
				},
				vehicle: {
					id: event.vehicle_id,
				},
			},
		})),
		header: {
			gtfsRealtimeVersion: '2.0',
			incrementality: 'FULL_DATASET',
			timestamp: DateTime.now().toUnixInteger(),
		},
	};
	// Do the conversion to Protobuf
	const FeedMessage = gtfsRealtime.root.lookupType('transit_realtime.FeedMessage');
	const message = FeedMessage.fromObject(allEventsPb);
	const buffer = FeedMessage.encode(message).finish();
	//
	return buffer;
	//
}

/* * */

export default async () => {
	//

	LOGGER.init();

	const globalTimer = new TIMETRACKER();

	//
	// Fetch latest events from PCGIDB

	const pcgidbTimer = new TIMETRACKER();

	const allPcgiVehicleEvents = await PCGIDB.VehicleEvents.find({ millis: { $gte: DateTime.now().minus({ minutes: 5 }).toMillis() } }).toArray();

	LOGGER.info(`Fetched ${allPcgiVehicleEvents.length} Vehicle Events from PCGIDB (${pcgidbTimer.get()})`);

	//
	// Get all archives from SERVERDB to set the active archive_id for each operator

	const archivesTimer = new TIMETRACKER();

	const currentArchiveIds = {};

	const allArchivesTxt = await SERVERDB.client.get('v2/network/archives/all');
	const allArchivesData = JSON.parse(allArchivesTxt);

	for (const archiveData of allArchivesData) {
		const archiveStartDate = DateTime.fromFormat(archiveData.start_date, 'yyyyMMdd');
		const archiveEndDate = DateTime.fromFormat(archiveData.end_date, 'yyyyMMdd');
		if (archiveStartDate > DateTime.now() || archiveEndDate < DateTime.now()) {
			continue;
		}
		else {
			currentArchiveIds[archiveData.operator_id] = archiveData.id;
		}
	}

	LOGGER.info(`Fetched ${allArchivesData.length} Archives from SERVERDB (${archivesTimer.get()})`);

	//
	// Update vehicles with the latest events

	const parseTimer = new TIMETRACKER();

	const allVehiclesUpdated = new Map();

	for (const pcgiVehicleEvent of allPcgiVehicleEvents) {
		//

		//
		// Perform basic event validations

		// Does this event have a valid vehicle id
		if (!pcgiVehicleEvent.content?.entity[0]?.vehicle?.vehicle?._id?.length) continue;
		// Does this event have a valid agency id
		if (!pcgiVehicleEvent.content?.entity[0]?.vehicle?.agencyId?.length) continue;
		// Does this event have an associated trip
		if (!pcgiVehicleEvent.content?.entity[0]?.vehicle?.trip?.tripId?.length) continue;
		// Does this event have a valid latitude and longitude
		if (!Math.floor(pcgiVehicleEvent?.content?.entity[0]?.vehicle?.position?.latitude) || !Math.floor(pcgiVehicleEvent?.content?.entity[0]?.vehicle?.position?.longitude)) continue;
		// Skip if the trip is not scheduled
		if (pcgiVehicleEvent.content?.entity[0]?.vehicle?.trip?.scheduleRelationship !== 'SCHEDULED') continue;
		// Skip if the route id is excessively long
		if (pcgiVehicleEvent.content?.entity[0]?.vehicle?.trip?.routeId?.length > 8) continue;
		// Skip if the stop id is not 6 digits
		if (pcgiVehicleEvent.content?.entity[0]?.vehicle?.stopId.length !== 6) continue;
		// Is this event older than 90 seconds
		if (pcgiVehicleEvent?.content?.entity[0]?.vehicle?.timestamp < DateTime.now().minus({ seconds: 90 }).toUnixInteger()) continue;

		//
		// Prepare the most used variables

		const vehicleId = `${pcgiVehicleEvent.content.entity[0].vehicle.agencyId}|${pcgiVehicleEvent.content.entity[0].vehicle.vehicle._id}`;
		const vehicleTimestamp = pcgiVehicleEvent.content.entity[0].vehicle.timestamp;
		const vehicleTripId = pcgiVehicleEvent.content.entity[0].vehicle.trip.tripId;
		const vehicleBearing = Math.floor(pcgiVehicleEvent?.content?.entity[0]?.vehicle?.position?.bearing || 0);
		const vehicleSpeed = pcgiVehicleEvent?.content?.entity[0]?.vehicle?.position?.speed / 3.6 || 0; // in meters per second

		//
		// Check if a more recent event was already saved for this vehicle during this sync iteration

		if (allVehiclesUpdated.get(vehicleId) && allVehiclesUpdated.get(vehicleId).timestamp >= vehicleTimestamp) continue;

		const operatorId = pcgiVehicleEvent.content?.entity[0]?.vehicle?.agencyId;

		//
		// Fetch pattern information from SERVERDB

		// const patternDataTxt = await SERVERDB.client.get(`patterns:${pcgiVehicleEvent.content.entity[0].vehicle.trip.patternId}`);
		// const patternDataJson = await JSON.parse(patternDataTxt);

		//
		// Save the current event to the map variable

		allVehiclesUpdated.set(vehicleId, {
			bearing: vehicleBearing,
			block_id: pcgiVehicleEvent.content.entity[0].vehicle.vehicle.blockId,
			current_status: pcgiVehicleEvent.content.entity[0].vehicle.currentStatus, // Current status can be 'IN_TRANSIT_TO', 'INCOMMING_AT' or 'STOPPED_AT' at the current stop_id
			direction_id: undefined, // patternDataJson.direction,
			event_id: `${currentArchiveIds[operatorId]}-${vehicleId}-${vehicleTripId}`, // Event ID should be kept stable for the duration of a single trip
			latitude: pcgiVehicleEvent.content.entity[0].vehicle.position.latitude,
			line_id: pcgiVehicleEvent.content.entity[0].vehicle.trip.lineId,
			longitude: pcgiVehicleEvent.content.entity[0].vehicle.position.longitude,
			pattern_id: pcgiVehicleEvent.content.entity[0].vehicle.trip.patternId,
			route_id: pcgiVehicleEvent.content.entity[0].vehicle.trip.routeId,
			schedule_relationship: pcgiVehicleEvent.content.entity[0].vehicle.trip.scheduleRelationship === 'SCHEDULED' ? 'SCHEDULED' : 'DUPLICATED', // Schedule relationship can be SCHEDULED for archivened trips or ADDED for new trips created by the driver
			shift_id: pcgiVehicleEvent.content.entity[0].vehicle.vehicle.shiftId,
			speed: vehicleSpeed,
			stop_id: pcgiVehicleEvent.content.entity[0].vehicle.stopId, // The stop the vehicle is serving at the moment
			timestamp: vehicleTimestamp, // Timestamp is in UTC
			trip_id: `${vehicleTripId}_${currentArchiveIds[operatorId]}`, // Trip ID, Pattern ID, Route ID and Line ID should always be known entities in the scheduled GTFS
			vehicle_id: vehicleId, // The vehicle ID is composed of the agency_id and the vehicle_id
		});

		//
	}

	LOGGER.info(`Parsed ${allPcgiVehicleEvents.length} Vehicle Events into ${allVehiclesUpdated.size} unique Vehicles (${parseTimer.get()})`);

	// 4.
	// Prepare the Vehicle Events data in JSON and Protobuf formats

	const conversionsTimer = new TIMETRACKER();

	const allVehiclesUpdatedArray = Array.from(allVehiclesUpdated.values());

	const allVehiclesUpdatedJson = convertToJson(allVehiclesUpdatedArray);
	await SERVERDB.client.set(`v2/network/vehicles/json`, JSON.stringify(allVehiclesUpdatedJson));

	const allVehiclesUpdatedProtobuf = convertToProtobuf(allVehiclesUpdatedArray);
	await SERVERDB.client.set(`v2/network/vehicles/protobuf`, Buffer.from(allVehiclesUpdatedProtobuf));

	LOGGER.info(`Converted unique Vehicles to JSON and Protobuf formats (${conversionsTimer.get()})`);

	LOGGER.terminate(`Done with this iteration (${globalTimer.get()})`);

	//
};
