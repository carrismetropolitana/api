/* * */

import { TripScheduleRelationship, VehicleStopStatus } from 'gtfs-types';

export interface VehicleMetadata {
	agency_id: string
	bikes_allowed: boolean
	capacity_seated?: number
	capacity_standing?: number
	capacity_total?: number
	emission_class: EmissionClass
	id: string
	license_plate?: string
	make?: string
	model?: string
	owner?: string
	propulsion: Propulsion
	registration_date?: string
	wheelchair_accessible: boolean
}

/* * */

export enum EmissionClass {
	euro1 = 'euro_1',
	euro2 = 'euro_2',
	euro3 = 'euro_3',
	euro4 = 'euro_4',
	euro5 = 'euro_5',
	euro6 = 'euro_6',
	unknown = 'unknown',
};

export function convertEmissionClassCode(emissionClassCode: string): EmissionClass {
	switch (emissionClassCode) {
		case '1':
			return EmissionClass.euro1;
		case '2':
			return EmissionClass.euro2;
		case '3':
			return EmissionClass.euro3;
		case '4':
			return EmissionClass.euro4;
		case '5':
			return EmissionClass.euro5;
		case '6':
			return EmissionClass.euro6;
		default:
			return EmissionClass.unknown;
	}
}

/* * */

export enum Propulsion {
	biodiesel = 'biodiesel',
	diesel = 'diesel',
	electricity = 'electricity',
	gasoline = 'gasoline',
	hybrid = 'hybrid',
	lpgAuto = 'lpg_auto',
	mixture = 'mixture',
	natural_gas = 'natural_gas',
	unknown = 'unknown',
}

export function convertPropulsionCode(propulsionCode: string): Propulsion {
	switch (propulsionCode) {
		case '1':
			return Propulsion.gasoline;
		case '2':
			return Propulsion.diesel;
		case '3':
			return Propulsion.lpgAuto;
		case '4':
			return Propulsion.mixture;
		case '5':
			return Propulsion.biodiesel;
		case '6':
			return Propulsion.electricity;
		case '7':
			return Propulsion.hybrid;
		case '8':
			return Propulsion.natural_gas;
		default:
			return Propulsion.unknown;
	}
}

/* * */

export enum OccupancyStatus {
	empty = 'empty',
	full = 'full',
	seats_available = 'seats_available',
	standing_only = 'standing_only',
	unknown = 'unknown',
}

/* * */

export interface VehiclePosition extends VehicleMetadata {
	bearing: number
	block_id?: string
	current_status: VehicleStopStatus
	direction_id: number
	event_id: string
	lat: number
	line_id: string
	lon: number
	occupancy_estimated?: number
	occupancy_status?: OccupancyStatus
	pattern_id: string
	route_id: string
	schedule_relationship: TripScheduleRelationship
	shift_id?: string
	speed: number
	stop_id: string
	timestamp: number
	trip_id: string
}

export type Vehicle = VehicleMetadata & VehiclePosition;
