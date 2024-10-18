/* * */

import type { WheelchairBoardingType } from 'gtfs-types';

import type { Locality } from './locations.js';

/* * */

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
	archive_id: string
	end_date: string
	operator_id: string
	start_date: string
}

export interface Line {
	color: string
	facilities: string[]
	line_id: string
	localities: Locality[]
	long_name: string
	pattern_ids: string[]
	route_ids: string[]
	short_name: string
	text_color: string
}

export interface Route {
	color: string
	facilities: string[]
	line_id: string
	localities: Locality[]
	long_name: string
	pattern_ids: string[]
	route_id: string
	short_name: string
	text_color: string
}

export type PatternGroup = Pattern[];

export interface Pattern {
	color: string
	direction: string
	facilities: string[]
	headsign: string
	line_id: string
	localities: Locality[]
	path: Path[]
	pattern_id: string
	pattern_version_id: string
	route_id: string
	shape_id: string
	short_name: string
	text_color: string
	trip_groups: TripGroup[]
	valid_on: string[]
}

export type Path = Waypoint[];

export interface Waypoint {
	allow_drop_off: boolean
	allow_pickup: boolean
	distance: number
	distance_delta: number
	stop: Stop
	stop_sequence: number
}

export interface TripGroup {
	schedule: Schedule[]
	service_ids: string[]
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
	lat: number
	line_ids: string[]
	locality: Locality
	lon: number
	operational_status: OperationalStatus
	pattern_ids: string[]
	route_ids: string[]
	short_name: string
	stop_id: string
	stop_name: string
	tts_name: string
	wheelchair_boarding: WheelchairBoardingType
}

export enum OperationalStatus {
	active = 'ACTIVE',
	seasonal = 'SEASONAL',
	voided = 'VOIDED',
}
