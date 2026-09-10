/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type Vehicle, VehicleCurrentStatus, VehicleOccupancyStatus, VehicleScheduleRelationship } from '@carrismetropolitana/api-types/vehicles';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { type HubV1ApiVehiclePosition } from '@tmlmobilidade/go-types-hub';
import { type ApiResponse } from '@tmlmobilidade/go-types-shared';
import { DateTime } from 'luxon';

/* * */

function convertToProtobuf(allEvents: Vehicle[]) {
	return {
		entity: allEvents
			.filter(event => Boolean(event.trip_id))
			.filter(event => event.timestamp > DateTime.now().minus({ seconds: 90 }).toUnixInteger())
			.map(event => ({
				id: event.event_id,
				vehicle: {
					current_status: event.current_status,
					occupancy_status: event.occupancy_status,
					position: {
						bearing: event.bearing,
						latitude: event.lat,
						longitude: event.lon,
						speed: event.speed,
					},
					stop_id: event.stop_id,
					timestamp: event.timestamp,
					trip: {
						direction_id: event.direction_id,
						route_id: event.route_id,
						schedule_relationship: event.schedule_relationship,
						trip_id: event.trip_id,
					},
					vehicle: {
						id: event.id,
						label: event.id.substring(3),
						license_plate: event.license_plate,
						wheelchair_accessible: event.wheelchair_accessible ? 'WHEELCHAIR_ACCESSIBLE' : 'NO_VALUE',
					},
				},
			})),
		header: {
			gtfs_realtime_version: '2.0',
			incrementality: 'FULL_DATASET',
			timestamp: DateTime.now().toUnixInteger(),
		},
	};
}

/* * */

const agencyIdMap = {
	A2L1N: '44',
	BNA17: '42',
	LA77N: '41',
	YA15B: '43',
};

/* * */

export const syncPositions = async () => {
	//

	LOGGER.title(`SYNC POSITIONS`);

	const globalTimer = new TIMETRACKER();

	const goResponse = await fetch('https://go.tmlmobilidade.pt/hub/api/v1/realtime/vehicles/positions');
	const goResponseJson = await goResponse.json() as ApiResponse<HubV1ApiVehiclePosition[]>;

	const cmVehiclePositions = goResponseJson.data.filter(vp => ['A2L1N', 'BNA17', 'LA77N', 'YA15B'].includes(vp.agency_id));

	LOGGER.info(`Fetched ${cmVehiclePositions.length} Vehicle Positions from GO for CM agencies. (${globalTimer.get()})`);

	const parsedVehicles: Vehicle[] = [];

	for (const cmVehiclePosition of cmVehiclePositions) {
		const vehicle: Vehicle = {
			agency_id: agencyIdMap[cmVehiclePosition.agency_id],
			bearing: cmVehiclePosition.bearing,
			bikes_allowed: false,
			block_id: null,
			capacity_seated: 0,
			capacity_standing: 0,
			capacity_total: 0,
			contactless: true,
			current_status: cmVehiclePosition.current_status as VehicleCurrentStatus,
			direction_id: Number(cmVehiclePosition.direction_id),
			door_status: 'CLOSED',
			emission_class: null,
			event_id: cmVehiclePosition._id,
			id: cmVehiclePosition.vehicle_id,
			lat: cmVehiclePosition.latitude,
			license_plate: null,
			line_id: cmVehiclePosition.route_short_name,
			lon: cmVehiclePosition.longitude,
			make: null,
			model: null,
			occupancy_estimated: null,
			occupancy_status: VehicleOccupancyStatus.no_data_available,
			owner: null,
			pattern_id: cmVehiclePosition.shape_id,
			propulsion: null,
			registration_date: null,
			route_id: cmVehiclePosition.route_id,
			schedule_relationship: VehicleScheduleRelationship.scheduled,
			shift_id: null,
			speed: cmVehiclePosition.speed,
			stop_id: cmVehiclePosition.stop_id,
			timestamp: cmVehiclePosition.created_at,
			trip_id: cmVehiclePosition.trip_id,
			wheelchair_accessible: null,
		};
		parsedVehicles.push(vehicle);
	}

	await SERVERDB.set(SERVERDB_KEYS.NETWORK.VEHICLES.ALL, JSON.stringify(parsedVehicles));

	LOGGER.info(`Saved ${parsedVehicles.length} Vehicles to SERVERDB (${globalTimer.get()})`);

	//
	// Prepare the Vehicle Events data in Protobuf format

	const conversionTimer = new TIMETRACKER();

	const allVehiclesMapProtobuf = convertToProtobuf(parsedVehicles);
	await SERVERDB.set(SERVERDB_KEYS.NETWORK.VEHICLES.PROTOBUF, JSON.stringify(allVehiclesMapProtobuf));

	LOGGER.info(`Converted ${parsedVehicles.length} Vehicles to Protobuf formats (${conversionTimer.get()})`);

	//
};

/* * */

// export const syncPositions2 = async () => {
// 	//

// 	LOGGER.title(`SYNC POSITIONS`);

// 	//
// 	// Get all plans from SERVERDB to set the active plan_id for each operator

// 	const plansTimer = new TIMETRACKER();

// 	const currentPlanIds = await getCurrentPlanIds();

// 	LOGGER.info(`Fetched Plans from SERVERDB (${plansTimer.get()})`);

// 	//
// 	// Fetch existing vehicles from SERVERDB

// 	const fetchServerdbTimer = new TIMETRACKER();

// 	const existingVehicleTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.VEHICLES.ALL) as string;
// 	const existingVehicleData: Vehicle[] = JSON.parse(existingVehicleTxt);

// 	const allVehiclesMap = new Map<string, Vehicle>();
// 	existingVehicleData.forEach(vehicle => allVehiclesMap.set(vehicle.id, vehicle));

// 	LOGGER.info(`Fetched ${allVehiclesMap.size} Vehicles from SERVERDB (${fetchServerdbTimer.get()})`);

// 	//
// 	// Fetch latest events from PCGIDB

// 	const pcgidbTimer = new TIMETRACKER();

// 	const allPcgiVehicleEvents = await PCGIDB.vehicleEventsCollection.find({ millis: { $gte: DateTime.now().minus({ minutes: 5 }).toMillis() } }).toArray();

// 	const allPcgiVehicleEventsSorted = allPcgiVehicleEvents.sort((a, b) => a.content.entity[0].vehicle.timestamp - b.content.entity[0].vehicle.timestamp);

// 	LOGGER.info(`Fetched ${allPcgiVehicleEvents.length} Vehicle Events from PCGIDB (${pcgidbTimer.get()})`);

// 	//
// 	// Update vehicles with the latest events

// 	const parseTimer = new TIMETRACKER();

// 	for (const pcgiVehicleEvent of allPcgiVehicleEventsSorted) {
// 		//

// 		//
// 		// Perform basic event validations

// 		// Does this event have a valid vehicle id
// 		if (!pcgiVehicleEvent.content?.entity[0]?.vehicle?.vehicle?._id?.length) continue;
// 		// Does this event have a valid agency id
// 		if (!pcgiVehicleEvent.content?.entity[0]?.vehicle?.agencyId?.length) continue;
// 		// Does this event have an associated trip
// 		if (!pcgiVehicleEvent.content?.entity[0]?.vehicle?.trip?.tripId?.length) continue;
// 		// Does this event have a valid latitude and longitude
// 		if (!Math.floor(pcgiVehicleEvent?.content?.entity[0]?.vehicle?.position?.latitude) || !Math.floor(pcgiVehicleEvent?.content?.entity[0]?.vehicle?.position?.longitude)) continue;
// 		// // Skip if the trip is not scheduled
// 		// if (pcgiVehicleEvent.content?.entity[0]?.vehicle?.trip?.scheduleRelationship !== 'SCHEDULED') continue;
// 		// Skip if the route id is excessively long
// 		if (pcgiVehicleEvent.content?.entity[0]?.vehicle?.trip?.routeId?.length > 8) continue;
// 		// Skip if the stop id is not 6 digits
// 		if (pcgiVehicleEvent.content?.entity[0]?.vehicle?.stopId.length !== 6) continue;
// 		// Is this event older than 90 seconds
// 		if (pcgiVehicleEvent?.content?.entity[0]?.vehicle?.timestamp < DateTime.now().minus({ seconds: 90 }).toUnixInteger()) continue;

// 		//
// 		// Prepare the most used variables

// 		const vehicleId = `${pcgiVehicleEvent.content.entity[0].vehicle.agencyId}|${pcgiVehicleEvent.content.entity[0].vehicle.vehicle._id}`;
// 		const vehicleTimestamp = pcgiVehicleEvent.content.entity[0].vehicle.timestamp;
// 		const vehicleTripId = pcgiVehicleEvent.content.entity[0].vehicle.trip.tripId;
// 		const vehicleBearing = Math.floor(Number(pcgiVehicleEvent?.content?.entity[0]?.vehicle?.position?.bearing) || 0);
// 		const vehicleSpeed = pcgiVehicleEvent?.content?.entity[0]?.vehicle?.position?.speed / 3.6 || 0; // in meters per second
// 		const agencyId = pcgiVehicleEvent.content?.entity[0]?.vehicle?.agencyId;

// 		//
// 		// Check if there is a vehicle with the same ID and a newer timestamp

// 		const existingVehicle = allVehiclesMap.get(vehicleId);

// 		if (existingVehicle && existingVehicle?.timestamp >= vehicleTimestamp) {
// 			continue;
// 		}

// 		//
// 		// Prepare the updated vehicle object

// 		const updateVehicleObject: Vehicle = {
// 			...existingVehicle,
// 			agency_id: agencyId,
// 			bearing: vehicleBearing,
// 			block_id: pcgiVehicleEvent.content.entity[0].vehicle.vehicle.blockId,
// 			current_status: convertVehicleCurrentStatusCode(String(pcgiVehicleEvent.content.entity[0].vehicle.currentStatus)),
// 			direction_id: undefined, // patternDataJson.direction,
// 			event_id: `${currentPlanIds[agencyId]}-${vehicleId}-${vehicleTripId}`, // Event ID should be kept stable for the duration of a single trip
// 			id: vehicleId, // The vehicle ID is composed of the agency_id and the vehicle_id
// 			lat: pcgiVehicleEvent.content.entity[0].vehicle.position.latitude,
// 			line_id: pcgiVehicleEvent.content.entity[0].vehicle.trip.lineId,
// 			lon: pcgiVehicleEvent.content.entity[0].vehicle.position.longitude,
// 			pattern_id: pcgiVehicleEvent.content.entity[0].vehicle.trip.patternId,
// 			route_id: pcgiVehicleEvent.content.entity[0].vehicle.trip.routeId,
// 			schedule_relationship: convertVehicleScheduleRelationshipCode(String(pcgiVehicleEvent.content.entity[0].vehicle.trip.scheduleRelationship)),
// 			shift_id: pcgiVehicleEvent.content.entity[0].vehicle.vehicle.shiftId,
// 			speed: vehicleSpeed,
// 			stop_id: pcgiVehicleEvent.content.entity[0].vehicle.stopId, // The stop the vehicle is serving at the moment
// 			timestamp: vehicleTimestamp, // Timestamp is in UTC
// 			trip_id: `[${currentPlanIds[agencyId]}]${vehicleTripId}`, // Trip ID, Pattern ID, Route ID and Line ID should always be known entities in the scheduled GTFS
// 		};

// 		//
// 		// Check if the Trip ID has changed between events.
// 		// If it has, the current occupancy count is reset to 0.

// 		if (existingVehicle?.trip_id !== pcgiVehicleEvent.content.entity[0].vehicle.trip.tripId) {
// 			updateVehicleObject.occupancy_estimated = 0;
// 			updateVehicleObject.occupancy_status = VehicleOccupancyStatus.no_data_available;
// 		}

// 		//
// 		// Update the occupancy status based on the estimated occupancy count sensors.
// 		// First, extract the sensor values from the event, and then update the vehicle object adding or subtracting the values.
// 		// Then, calculate the occupancy status based on the estimated occupancy count and the vehicle capacity.

// 		let estimatedOccupancyIncoming = 0;
// 		let estimatedOccupancyOutgoing = 0;

// 		pcgiVehicleEvent.content.entity[0].vehicle.passengerCounting.counting.forEach((counting) => {
// 			estimatedOccupancyIncoming += counting.incoming;
// 			estimatedOccupancyOutgoing += counting.outgoing;
// 		});

// 		updateVehicleObject.occupancy_estimated = (updateVehicleObject.occupancy_estimated ?? 0) + estimatedOccupancyIncoming - estimatedOccupancyOutgoing;

// 		if (updateVehicleObject.occupancy_estimated <= 0) {
// 			updateVehicleObject.occupancy_estimated = undefined;
// 			updateVehicleObject.occupancy_status = undefined;
// 		}
// 		else if (updateVehicleObject.occupancy_estimated < updateVehicleObject.capacity_seated) {
// 			updateVehicleObject.occupancy_status = VehicleOccupancyStatus.seats_available;
// 		}
// 		else if (updateVehicleObject.occupancy_estimated >= updateVehicleObject.capacity_seated && updateVehicleObject.occupancy_estimated < updateVehicleObject.capacity_total) {
// 			updateVehicleObject.occupancy_status = VehicleOccupancyStatus.standing_only;
// 		}
// 		else if (updateVehicleObject.occupancy_estimated >= updateVehicleObject.capacity_total) {
// 			updateVehicleObject.occupancy_status = VehicleOccupancyStatus.full;
// 		}

// 		//
// 		// Fetch pattern information from SERVERDB

// 		// const patternDataTxt = await SERVERDB.client.get(`patterns:${pcgiVehicleEvent.content.entity[0].vehicle.trip.patternId}`);
// 		// const patternDataJson = await JSON.parse(patternDataTxt);

// 		//
// 		// Set door status if event was triggered by a door status change

// 		if (pcgiVehicleEvent.content.entity[0].vehicle.trigger.door === 'OPENED') {
// 			updateVehicleObject.door_status = 'OPEN';
// 		}
// 		else if (pcgiVehicleEvent.content.entity[0].vehicle.trigger.door === 'CLOSED') {
// 			updateVehicleObject.door_status = 'CLOSED';
// 		}

// 		//
// 		// Save the updated vehicle to the Map

// 		allVehiclesMap.set(vehicleId, updateVehicleObject);

// 		//
// 	}

// 	LOGGER.info(`Parsed ${allPcgiVehicleEvents.length} Vehicle Events into ${allVehiclesMap.size} unique Vehicles (${parseTimer.get()})`);

// 	//
// 	// Save to SERVERDB

// 	const saveTimer = new TIMETRACKER();

// 	const allVehiclesMapArray = Array.from(allVehiclesMap.values());
// 	await SERVERDB.set(SERVERDB_KEYS.NETWORK.VEHICLES.ALL, JSON.stringify(allVehiclesMapArray));

// 	LOGGER.info(`Saved ${allVehiclesMap.size} Vehicles to SERVERDB (${saveTimer.get()})`);

// 	//
// 	// Prepare the Vehicle Events data in Protobuf format

// 	const conversionTimer = new TIMETRACKER();

// 	const allVehiclesMapProtobuf = convertToProtobuf(allVehiclesMapArray);
// 	await SERVERDB.set(SERVERDB_KEYS.NETWORK.VEHICLES.PROTOBUF, JSON.stringify(allVehiclesMapProtobuf));

// 	LOGGER.info(`Converted unique Vehicles to Protobuf formats (${conversionTimer.get()})`);

// 	//
// };

/* * */

// async function getCurrentPlanIds() {
// 	const currentPlanIds = {};
// 	const allPlansTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.PLANS) as string;
// 	const allPlansData: Plan[] = JSON.parse(allPlansTxt);

// 	for (const planData of allPlansData) {
// 		const todayOperationDate = getOperationalDay();
// 		if (planData.valid_range.start > todayOperationDate || planData.valid_range.end < todayOperationDate) continue;
// 		else currentPlanIds[planData.agency_id] = planData.id;
// 	}

// 	return currentPlanIds;
// }
