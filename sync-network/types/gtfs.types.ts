/* * */

export interface GtfsRoute {
	line_id: string
	line_long_name: string
	line_short_name: string
	route_color: string
	route_id: string
	route_long_name: string
	route_short_name: string
	route_text_color: string
	route_type: string
}

/* * */

export interface GtfsDate {
	date: string
	day_type: string
	description: string
	holiday: string
	period: string
}

/* * */

export interface GtfsPeriod {
	period_id: string
	period_name: string
}

/* * */

export interface GtfsCalendarDate {
	date: string
	day_type: string
	holiday: string
	period: string
	service_id: string
}

/* * */

export interface GtfsTrip {
	calendar_desc: string
	direction_id: number
	pattern_id: string
	route_id: string
	service_id: string
	shape_id: string
	trip_headsign: string
	trip_id: string
}

/* * */

export interface GtfsStopTime {
	arrival_time: string
	drop_off_type: string
	pickup_type: string
	shape_dist_traveled: string
	stop_id: string
	stop_sequence: number
	trip_id: string
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

export interface MonPeriod {
	dates: string[]
	id: string
	name: string
	valid: {
		from: string
		until?: string
	}[]
}
