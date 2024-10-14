/* * */

export interface VehicleMetadata {
	agency_id: string
	bikes_allowed: boolean
	capacity_seated?: number
	capacity_standing?: number
	capacity_total?: number
	emission_class: EmissionClass
	license_plate?: string
	make?: | string
	model?: | string
	owner?: | string
	propulsion: Propulsion
	registration_date?: string
	vehicle_id: string
	wheelchair_accessible: boolean
}

export interface VehiclePosition {
	bearing?: number
	block_id?: string
	current_status?: CurrentStatus
	direction_id?: number
	event_id: null | string
	lat: null | number
	line_id: null | string
	lon: null | number
	occupancy_estimated: null | number
	occupancy_status: null | OccupancyStatus
	pattern_id: null | string
	route_id: null | string
	schedule_relationship: null | ScheduleRelationship
	shift_id: null | string
	speed: null | number
	stop_id: null | string
	timestamp: string
	trip_id: null | string
	vehicle_id: string
}

export type Vehicle = VehicleMetadata & VehiclePosition;

/* * */

export type EmissionClass = 'euro_1' | 'euro_2' | 'euro_3' | 'euro_4' | 'euro_5' | 'euro_6' | 'unknown';

export function convertEmissionClassCode(emissionClassCode: string): EmissionClass {
	switch (emissionClassCode) {
		case '1':
			return 'euro_1';
		case '2':
			return 'euro_2';
		case '3':
			return 'euro_3';
		case '4':
			return 'euro_4';
		case '5':
			return 'euro_5';
		case '6':
			return 'euro_6';
		default:
			return 'unknown';
	}
}

/* * */

export type Propulsion = 'biodiesel' | 'diesel' | 'electricity' | 'gasoline' | 'hybrid' | 'lpg_auto' | 'mixture' | 'natural_gas' | 'unknown';

export function convertPropulsionCode(propulsionCode: string): Propulsion {
	switch (propulsionCode) {
		case '1':
			return 'gasoline';
		case '2':
			return 'diesel';
		case '3':
			return 'lpg_auto';
		case '4':
			return 'mixture';
		case '5':
			return 'biodiesel';
		case '6':
			return 'electricity';
		case '7':
			return 'hybrid';
		case '8':
			return 'natural_gas';
		default:
			return 'unknown';
	}
}

/* * */

export type OccupancyStatus = 'empty' | 'full' | 'moderate';

/* * */

export type CurrentStatus = 'IN_TRANSIT_TO' | 'INCOMMING_AT' | 'STOPPED_AT';

/* * */

export type ScheduleRelationship = 'DUPLICATED' | 'SCHEDULED';
