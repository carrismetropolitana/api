/* * */

import { Locality, Stop } from './stops.js';

/* * */

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
