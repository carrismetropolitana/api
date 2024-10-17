/* * */

import { PCGIDB, SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings/src/constants.js';
import { OccupancyStatus, Vehicle } from '@carrismetropolitana/api-types/src/api';
import { TripScheduleRelationship, VehicleEvent } from '@carrismetropolitana/api-types/src/gtfs';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { DateTime } from 'luxon';

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
	return {
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
}

/* * */

export const syncPositions = async () => {
	//

	LOGGER.title(`SYNC POSITIONS`);

	//
	// Get all archives from SERVERDB to set the active archive_id for each operator

	const archivesTimer = new TIMETRACKER();

	const currentArchiveIds = {};

	const allArchivesTxt = await SERVERDB.get(SERVERDB_KEYS.ARCHIVES.ALL);
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
	// Fetch existing vehicles from SERVERDB

	const fetchServerdbTimer = new TIMETRACKER();

	const existingVehicleTxt = await SERVERDB.get(SERVERDB_KEYS.VEHICLES.ALL);
	const existingVehicleData: Vehicle[] = JSON.parse(existingVehicleTxt);

	const allVehiclesMap = new Map<string, Vehicle>();
	existingVehicleData.forEach(vehicle => allVehiclesMap.set(vehicle.vehicle_id, vehicle));

	LOGGER.info(`Fetched ${allVehiclesMap.size} Vehicles from SERVERDB (${fetchServerdbTimer.get()})`);

	//
	// Fetch latest events from PCGIDB

	const pcgidbTimer = new TIMETRACKER();

	const allPcgiVehicleEvents: VehicleEvent[] = await PCGIDB.VehicleEvents.find({ millis: { $gte: DateTime.now().minus({ minutes: 5 }).toMillis() } }).toArray();

	const allPcgiVehicleEventsSorted = allPcgiVehicleEvents.sort((a, b) => a.content.entity[0].vehicle.timestamp - b.content.entity[0].vehicle.timestamp);

	LOGGER.info(`Fetched ${allPcgiVehicleEvents.length} Vehicle Events from PCGIDB (${pcgidbTimer.get()})`);

	//
	// Update vehicles with the latest events

	const parseTimer = new TIMETRACKER();

	for (const pcgiVehicleEvent of allPcgiVehicleEventsSorted) {
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
		// // Skip if the trip is not scheduled
		// if (pcgiVehicleEvent.content?.entity[0]?.vehicle?.trip?.scheduleRelationship !== 'SCHEDULED') continue;
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
		const vehicleBearing = Math.floor(Number(pcgiVehicleEvent?.content?.entity[0]?.vehicle?.position?.bearing) || 0);
		const vehicleSpeed = pcgiVehicleEvent?.content?.entity[0]?.vehicle?.position?.speed / 3.6 || 0; // in meters per second
		const operatorId = pcgiVehicleEvent.content?.entity[0]?.vehicle?.agencyId;

		//
		// Check if there is a vehicle with the same ID and a newer timestamp

		const existingVehicle = allVehiclesMap.get(vehicleId);

		if (existingVehicle && existingVehicle?.timestamp >= vehicleTimestamp) {
			continue;
		}

		//
		// Prepare the updated vehicle object

		const updateVehicleObject = {
			...existingVehicle,
			bearing: vehicleBearing,
			block_id: pcgiVehicleEvent.content.entity[0].vehicle.vehicle.blockId,
			current_status: pcgiVehicleEvent.content.entity[0].vehicle.currentStatus, // Current status can be 'IN_TRANSIT_TO', 'INCOMMING_AT' or 'STOPPED_AT' at the current stop_id
			direction_id: undefined, // patternDataJson.direction,
			event_id: `${currentArchiveIds[operatorId]}-${vehicleId}-${vehicleTripId}`, // Event ID should be kept stable for the duration of a single trip
			lat: pcgiVehicleEvent.content.entity[0].vehicle.position.latitude,
			line_id: pcgiVehicleEvent.content.entity[0].vehicle.trip.lineId,
			lon: pcgiVehicleEvent.content.entity[0].vehicle.position.longitude,
			pattern_id: pcgiVehicleEvent.content.entity[0].vehicle.trip.patternId,
			route_id: pcgiVehicleEvent.content.entity[0].vehicle.trip.routeId,
			schedule_relationship: pcgiVehicleEvent.content.entity[0].vehicle.trip.scheduleRelationship === TripScheduleRelationship.SCHEDULED ? TripScheduleRelationship.SCHEDULED : TripScheduleRelationship.ADDED, // Schedule relationship can be SCHEDULED for archivened trips or ADDED for new trips created by the driver
			shift_id: pcgiVehicleEvent.content.entity[0].vehicle.vehicle.shiftId,
			speed: vehicleSpeed,
			stop_id: pcgiVehicleEvent.content.entity[0].vehicle.stopId, // The stop the vehicle is serving at the moment
			timestamp: vehicleTimestamp, // Timestamp is in UTC
			trip_id: `${vehicleTripId}_${currentArchiveIds[operatorId]}`, // Trip ID, Pattern ID, Route ID and Line ID should always be known entities in the scheduled GTFS
			vehicle_id: vehicleId, // The vehicle ID is composed of the agency_id and the vehicle_id
		};

		//
		// Check if the Trip ID has changed between events.
		// If it has, the current occupancy count is reset to 0.

		if (existingVehicle?.trip_id !== pcgiVehicleEvent.content.entity[0].vehicle.trip.tripId) {
			updateVehicleObject.occupancy_estimated = 0;
			updateVehicleObject.occupancy_status = OccupancyStatus.empty;
		}

		//
		// Update the occupancy status based on the estimated occupancy count sensors.
		// First, extract the sensor values from the event, and then update the vehicle object adding or subtracting the values.
		// Then, calculate the occupancy status based on the estimated occupancy count and the vehicle capacity.

		let estimatedOccupancyIncoming = 0;
		let estimatedOccupancyOutgoing = 0;

		pcgiVehicleEvent.content.entity[0].vehicle.passengerCounting.counting.forEach((counting) => {
			estimatedOccupancyIncoming += counting.incoming;
			estimatedOccupancyOutgoing += counting.outgoing;
		});

		updateVehicleObject.occupancy_estimated = updateVehicleObject.occupancy_estimated + estimatedOccupancyIncoming - estimatedOccupancyOutgoing;

		if (updateVehicleObject.occupancy_estimated < 0) {
			updateVehicleObject.occupancy_estimated = 0;
			updateVehicleObject.occupancy_status = OccupancyStatus.unknown;
		}
		else if (updateVehicleObject.occupancy_estimated < updateVehicleObject.capacity_seated) {
			updateVehicleObject.occupancy_status = OccupancyStatus.seats_available;
		}
		else if (updateVehicleObject.occupancy_estimated >= updateVehicleObject.capacity_seated && updateVehicleObject.occupancy_estimated < updateVehicleObject.capacity_total) {
			updateVehicleObject.occupancy_status = OccupancyStatus.standing_only;
		}
		else if (updateVehicleObject.occupancy_estimated >= updateVehicleObject.capacity_total) {
			updateVehicleObject.occupancy_status = OccupancyStatus.full;
		}

		//
		// Fetch pattern information from SERVERDB

		// const patternDataTxt = await SERVERDB.client.get(`patterns:${pcgiVehicleEvent.content.entity[0].vehicle.trip.patternId}`);
		// const patternDataJson = await JSON.parse(patternDataTxt);

		//
		// Save the updated vehicle to the Map

		allVehiclesMap.set(vehicleId, updateVehicleObject);

		//
	}

	LOGGER.info(`Parsed ${allPcgiVehicleEvents.length} Vehicle Events into ${allVehiclesMap.size} unique Vehicles (${parseTimer.get()})`);

	//
	// Save to SERVERDB

	const saveTimer = new TIMETRACKER();

	const allVehiclesMapArray = Array.from(allVehiclesMap.values());
	await SERVERDB.set(SERVERDB_KEYS.VEHICLES.ALL, JSON.stringify(allVehiclesMapArray));

	LOGGER.info(`Saved ${allVehiclesMap.size} Vehicles to SERVERDB (${saveTimer.get()})`);

	//
	// Prepare the Vehicle Events data in JSON and Protobuf formats

	const conversionsTimer = new TIMETRACKER();

	const allVehiclesMapJson = convertToJson(allVehiclesMapArray);
	await SERVERDB.set(SERVERDB_KEYS.VEHICLES.JSON, JSON.stringify(allVehiclesMapJson));

	const allVehiclesMapProtobuf = convertToProtobuf(allVehiclesMapArray);
	await SERVERDB.set(SERVERDB_KEYS.VEHICLES.PROTOBUF, JSON.stringify(allVehiclesMapProtobuf));

	LOGGER.success(`Converted unique Vehicles to JSON and Protobuf formats (${conversionsTimer.get()})`);

	//
};
