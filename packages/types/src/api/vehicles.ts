/* * */

export enum APIStatus {
	error = 'error',
	fail = 'fail',
	success = 'success',
}

export interface ApiResponse<T> {
	data?: null | T
	message?: null | string
	status: APIStatus
}

export interface VehicleV2 {

	capacity: {
		seated: number
		standing: number
		total: number
	}

	id: string

	metadata: {
		agency_id: string
		bikes_allowed: boolean
		emission_class: string
		license_plate: string
		make: string
		model: string
		owner: string
		propulsion: string
		registration_date: string
		wheelchair_accessible: string
	}

	ocupancy: {
		estimated: number
		status: VehicleOccupancyStatus
	}

	position: {
		bearing: number
		lat: number
		lon: number
		speed: number
	}

	service: {
		block_id: string
		current_status?: VehicleCurrentStatus
		direction_id: number
		event_id: number
		line_id: string
		pattern_id: string
		route_id: string
		schedule_relationship: VehicleScheduleRelationship
		shift_id: string
		stop_id: string
		timestamp: number
		trip_id: string
	}

	status: {
		s: string
	}

}

export interface Vehicle {
	agency_id: string
	bearing?: number
	bikes_allowed: boolean
	block_id?: string
	capacity_seated?: number
	capacity_standing?: number
	capacity_total?: number
	current_status?: VehicleCurrentStatus
	direction_id?: number
	door_status?: 'OPEN' | 'CLOSED'
	emission_class?: VehicleEmissionClass
	event_id?: string
	id: string
	lat?: number
	license_plate?: string
	line_id?: string
	lon?: number
	make?: string
	model?: string
	occupancy_estimated?: number
	occupancy_status?: VehicleOccupancyStatus
	owner?: string
	pattern_id?: string
	propulsion?: VehiclePropulsion
	registration_date?: string
	route_id?: string
	schedule_relationship?: VehicleScheduleRelationship
	shift_id?: string
	speed?: number
	stop_id?: string
	timestamp?: number
	trip_id?: string
	wheelchair_accessible: boolean
}

/* * */

export enum VehicleEmissionClass {
	euro1 = 'euro_1',
	euro2 = 'euro_2',
	euro3 = 'euro_3',
	euro4 = 'euro_4',
	euro5 = 'euro_5',
	euro6 = 'euro_6',
};

export function convertVehicleEmissionClassCode(value: string): undefined | VehicleEmissionClass {
	switch (value) {
		case '1':
			return VehicleEmissionClass.euro1;
		case '2':
			return VehicleEmissionClass.euro2;
		case '3':
			return VehicleEmissionClass.euro3;
		case '4':
			return VehicleEmissionClass.euro4;
		case '5':
			return VehicleEmissionClass.euro5;
		case '6':
			return VehicleEmissionClass.euro6;
		default:
			return undefined;
	}
}

/* * */

export enum VehiclePropulsion {
	biodiesel = 'biodiesel',
	diesel = 'diesel',
	electricity = 'electricity',
	gasoline = 'gasoline',
	hybrid = 'hybrid',
	lpgAuto = 'lpg_auto',
	mixture = 'mixture',
	natural_gas = 'natural_gas',
}

export function convertVehiclePropulsionCode(value: string): undefined | VehiclePropulsion {
	switch (value) {
		case '1':
			return VehiclePropulsion.gasoline;
		case '2':
			return VehiclePropulsion.diesel;
		case '3':
			return VehiclePropulsion.lpgAuto;
		case '4':
			return VehiclePropulsion.mixture;
		case '5':
			return VehiclePropulsion.biodiesel;
		case '6':
			return VehiclePropulsion.electricity;
		case '7':
			return VehiclePropulsion.hybrid;
		case '8':
			return VehiclePropulsion.natural_gas;
		default:
			return undefined;
	}
}

/* * */

export enum VehicleCurrentStatus {
	in_transit_to = 'IN_TRANSIT_TO',
	incoming_at = 'INCOMING_AT',
	stopped_at = 'STOPPED_AT',
}

export function convertVehicleCurrentStatusCode(value: string): undefined | VehicleCurrentStatus {
	switch (value) {
		case 'IN_TRANSIT_TO':
			return VehicleCurrentStatus.in_transit_to;
		case 'INCOMING_AT':
			return VehicleCurrentStatus.incoming_at;
		case 'STOPPED_AT':
			return VehicleCurrentStatus.stopped_at;
		default:
			return undefined;
	}
}

/* * */

export enum VehicleScheduleRelationship {
	added = 'ADDED',
	canceled = 'CANCELED',
	scheduled = 'SCHEDULED',
	unscheduled = 'UNSCHEDULED',
}

export function convertVehicleScheduleRelationshipCode(value: string): undefined | VehicleScheduleRelationship {
	switch (value) {
		case 'ADDED':
			return VehicleScheduleRelationship.added;
		case 'SCHEDULED':
			return VehicleScheduleRelationship.scheduled;
		default:
			return VehicleScheduleRelationship.added;
	}
}

/* * */

export enum VehicleOccupancyStatus {
	empty = 'EMPTY',
	full = 'FULL',
	no_data_available = 'NO_DATA_AVAILABLE',
	seats_available = 'SEATS_AVAILABLE',
	standing_only = 'STANDING_ONLY',
}
