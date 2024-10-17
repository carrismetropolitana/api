/* * */

import { FeedHeader, Position, TripScheduleRelationship, VehicleStopStatus } from 'gtfs-types';

/* * */

export interface VehicleEvent {
	content: VehicleEventContent
	millis: number
}

export interface VehicleEventContent {
	entity: VehicleEventEntityExtended[]
	header: FeedHeader
}

export interface VehicleEventEntityExtended {
	_id: string
	vehicle: VehiclePositionExtended
}

export interface VehiclePositionExtended {
	agencyId: string
	currentStatus: VehicleStopStatus
	operationPlanId: string
	passengerCounting: VehiclePositionExtendedPassengerCounting
	position: Position
	stopId: string
	timestamp: number
	trigger: VehiclePositionExtendedTrigger
	trip: VehiclePositionExtendedTrip
	vehicle: VehiclePositionExtendedVehicle
}

export interface VehiclePositionExtendedTrigger {
	activity: string
	door: string
}

export interface VehiclePositionExtendedTrip {
	lineId: string
	patternId: string
	routeId: string
	scheduleRelationship: TripScheduleRelationship
	tripId: string
}

export interface VehiclePositionExtendedVehicle {
	_id: string
	blockId: string
	driverId: string
	shiftId: string
}

export interface VehiclePositionExtendedPassengerCounting {
	counting: VehiclePositionExtendedPassengerCountingCount[]
}

export interface VehiclePositionExtendedPassengerCountingCount {
	classId: 'adult' | 'children'
	incoming: number
	outgoing: number
}
