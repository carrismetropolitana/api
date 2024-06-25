/* * */

import type { MonStop } from '@/services/NETWORKDB.types.js';

/* * */

export interface Line {
	color: string
	facilities: string[]
	line_id: string
	localities: string[]
	long_name: string
	municipality_ids: string[]
	pattern_ids: string[]
	route_ids: string[]
	short_name: string
	text_color: string
}

/* * */

export interface Route {
	color: string
	facilities: string[]
	line_id: string
	localities: string[]
	long_name: string
	municipality_ids: string[]
	pattern_ids: string[]
	route_id: string
	short_name: string
	text_color: string
}

/* * */

export interface PatternGroup {
	color: string
	direction: string
	facilities: string[]
	headsign: string
	line_id: string
	localities: string[]
	municipality_ids: string[]
	path: PatternGroupPath[]
	pattern_group_id: string
	pattern_id: string
	route_id: string
	shape_id: string
	short_name: string
	text_color: string
	trip_groups: PatternGroupTripGroup
	valid_on: string[]
}

/* * */

export interface PatternGroupPath {
	allow_drop_off: boolean
	allow_pickup: boolean
	distance_delta: number
	stop: MonStop
	stop_sequence: number
}

/* * */

export interface PatternGroupTripGroup {
	dates: []
	schedule: PatternGroupTripGroupSchedule[]
	trip_ids: []
}

/* * */

export interface PatternGroupTripGroupSchedule {
	arrival_time: string
	arrival_time_24h: string
	stop_id: string
	stop_sequence: string
}

/* * */

interface GTFSMunicipality {
	district_id: string
	district_name: string
	municipality_id: string
	municipality_name: string
	municipality_prefix: string
	region_id: string
	region_name: string
}

interface GTFSShape {
	shape_dist_traveled: number
	shape_id: string
	shape_pt_lat: number
	shape_pt_lon: number
	shape_pt_sequence: number
}

interface GTFSStop {
	airport: boolean
	bike_parking: boolean
	bike_sharing: boolean
	boat: boolean
	car_parking: boolean
	district_id: string
	district_name: string
	light_rail: boolean
	locality: string
	municipality_id: string
	municipality_name: string
	near_fire_station: boolean
	near_health_clinic: boolean
	near_historic_building: boolean
	near_hospital: boolean
	near_police_station: boolean
	near_school: boolean
	near_shopping: boolean
	near_transit_office: boolean
	near_university: boolean
	parish_id: string
	parish_name: string
	region_id: string
	region_name: string
	stop_id: string
	stop_lat: string
	stop_lon: string
	stop_name: string
	stop_short_name: string
	subway: boolean
	train: boolean
	tts_stop_name: string
	wheelchair_boarding: string
}

interface MonPattern {
	color: string
	direction: number
	facilities: Facility[]
	headsign: string
	id: string
	line_id: string
	localities: string[]
	municipalities: string[]
	path: Path[]
	route_id: string
	shape_id: string
	short_name: string
	text_color: string
	trips: Trip[]
	valid_on: string[]
}

interface Path {
	Stop: Stop
	allow_drop_off: boolean
	allow_pickup: boolean
	distance_delta: number
	stop_sequence: number
}

interface Stop {
	district_id: string
	district_name: string
	facilities: string[]
	id: string
	lat: string
	lines: string[]
	locality: string
	lon: string
	municipality_id: string
	municipality_name: string
	name: string
	parish_id: null | string
	parish_name: null | string
	patterns: string[]
	region_id: string
	region_name: string
	routes: string[]
	short_name: null | string
	tts_name: string
	wheelchair_boarding: null | string
}

interface Trip {
	calendar_description: string
	calendar_id: string
	dates: string[]
	id: string
	schedule: Schedule[]
}

interface Schedule {
	arrival_time: string
	arrival_time_operation: string
	stop_id: string
	stop_sequence: number
	travel_time: string
}
enum Facility {
	AIRPORT = 'airport',
	BIKE_PARKING = 'bike_parking',
	BIKE_SHARING = 'bike_sharing',
	BOAT = 'boat',
	CAR_PARKING = 'car_parking',
	LIGHT_RAIL = 'light_rail',
	NEAR_FIRE_STATION = 'near_fire_station',
	NEAR_HEALTH_CLINIC = 'near_health_clinic',
	NEAR_HISTORIC_BUILDING = 'near_historic_building',
	NEAR_HOSPITAL = 'near_hospital',
	NEAR_POLICE_STATION = 'near_police_station',
	NEAR_SCHOOL = 'near_school',
	NEAR_SHOPPING = 'near_shopping',
	NEAR_TRANSIT_OFFICE = 'near_transit_office',
	NEAR_UNIVERSITY = 'near_university',
	SUBWAY = 'subway',
	TRAIN = 'train',
}
