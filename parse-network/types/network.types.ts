/* * */

export interface NetworkLine {
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

export interface NetworkRoute {
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

export interface NetworkStop {
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
	parish_id: string
	parish_name: string
	patterns: string[]
	region_id: string
	region_name: string
	routes: string[]
	short_name: string
	tts_name: string
	wheelchair_boarding: string
}

/* * */

export interface NetworkPattern {
	color: string
	direction: string
	facilities: string[]
	headsign: string
	line_id: string
	localities: string[]
	municipality_ids: string[]
	path: NetworkPatternPathItem[]
	pattern_id: string
	pattern_unique_id: string
	route_id: string
	shape_id: string
	short_name: string
	text_color: string
	trips: NetworkPatternTrip[]
	valid_on: string[]
}

/* * */

export interface NetworkPatternPathItem {
	allow_drop_off: boolean
	allow_pickup: boolean
	distance_delta: number
	stop: NetworkStop
	stop_sequence: number
}

/* * */

export interface NetworkPatternTrip {
	schedule: NetworkPatternTripSchedule[]
	service_ids: string[]
	trip_ids: string[]
	valid_on: string[]
}

/* * */

export interface NetworkPatternTripSchedule {
	arrival_time: string
	arrival_time_24h: string
	stop_id: string
	stop_sequence: number
}
