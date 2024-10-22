/* * */

import type { Feature, LineString } from 'geojson';
import type { WheelchairBoardingType } from 'gtfs-types';

import type { Location } from './locations.js';

/* * */

export interface Date {
	date: string
	day_type: DayType
	description: string
	holiday: boolean
	period: string
}

export enum DayType {
	saturday = '2',
	sundayOrHoliday = '3',
	weekday = '1',
}

export enum PeriodType {
	schoolOff = '2',
	schoolOn = '1',
	summer = '3',
}

/* * */

export interface ValidityGroup {
	valid_from: string
	valid_until?: string
}

export interface Period {
	dates: string[]
	period_id: string
	period_name: string
	validity_groups: ValidityGroup[]
}

export interface Archive {
	end_date: string
	id: string
	operator_id: string
	start_date: string
}

export interface Line {
	color: string
	facilities: string[]
	id: string
	locations: Location[]
	long_name: string
	pattern_ids: string[]
	route_ids: string[]
	short_name: string
	text_color: string
	tts_name: string
}

export interface Route {
	color: string
	facilities: string[]
	id: string
	line_id: string
	locations: Location[]
	long_name: string
	pattern_ids: string[]
	short_name: string
	text_color: string
	tts_name: string
}

export type PatternGroup = Pattern[];

export interface Pattern {
	color: string
	direction_id: 0 | 1
	facilities: string[]
	headsign: string
	id: string
	line_id: string
	locations: Location[]
	path: Path
	pattern_version_id: string
	route_id: string
	shape_id: string
	short_name: string
	text_color: string
	trip_groups: TripGroup[]
	tts_headsign: string
	valid_on: string[]
}

export type Path = Waypoint[];

export interface Waypoint {
	allow_drop_off: boolean
	allow_pickup: boolean
	distance: number
	distance_delta: number
	// stop: Stop
	stop_id: string
	stop_sequence: number
}

export interface TripGroup {
	schedule: Schedule[]
	service_ids: string[]
	trip_group_id: string
	trip_ids: string[]
	valid_on: string[]
}

export interface Schedule {
	arrival_time: string
	arrival_time_24h: string
	stop_id: string
	stop_sequence: number
}

export interface Stop {
	facilities: string[]
	id: string
	lat: number
	line_ids: string[]
	location: Location
	lon: number
	operational_status: OperationalStatus
	pattern_ids: string[]
	route_ids: string[]
	short_name: string
	stop_name: string
	tts_name: string
	wheelchair_boarding: WheelchairBoardingType
}

export enum OperationalStatus {
	active = 'ACTIVE',
	seasonal = 'SEASONAL',
	voided = 'VOIDED',
}

export interface Shape {
	extension: number
	geojson: Feature<LineString>
	points: Point[]
	shape_id: string
}

export interface Point {
	shape_dist_traveled: number
	shape_pt_lat: number
	shape_pt_lon: number
	shape_pt_sequence: number
}
