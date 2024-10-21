/* * */

import { CalendarDates, GTFSBool, Route, Shapes, Stop, StopTime, Trip, WheelchairBoardingType } from 'gtfs-types';

/* * */

/**
 * Type for GTFS routes.txt file.
 */
export interface RouteExtended extends Route {
	line_id: string
	line_long_name: string
	line_short_name: string
}

/**
 * Type for GTFS calendar_dates.txt file.
 */
export interface CalendarDatesExtended extends CalendarDates {
	day_type: string
	holiday: string
	period: string
}

/**
 * Type for GTFS dates.txt file.
 */
export interface DatesExtended {
	date: string
	day_type: string
	description: string
	holiday: string
	period: string
}

/**
 * Type for GTFS periods.txt file.
 */
export interface PeriodsExtended {
	period_id: string
	period_name: string
}

/**
 * Type for GTFS trips.txt file.
 */
export interface TripsExtended extends Trip {
	calendar_desc: string
	pattern_id: string
}

/**
 * Type for GTFS stop_times.txt file.
 */
export type StopTimesExtended = StopTime;

/**
 * Type for GTFS shapes.txt file.
 */
export type ShapesExtended = Shapes;

/**
 * Type for GTFS stops.txt file.
 */
export interface StopsExtended extends Stop {
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
	operational_status: string
	parish_id: null
	parish_name: null
	region_id: string
	region_name: string
	stop_id: string
	stop_lat: number
	stop_lon: number
	stop_name: string
	stop_short_name: string
	subway: boolean
	train: boolean
	tts_stop_name: string
	wheelchair_boarding: WheelchairBoardingType
}

/**
 * Type for GTFS vehicles.txt file.
 */
export interface VehiclesExtended {
	agency_id: string
	bikes_allowed: GTFSBool
	capacity_seated: number
	capacity_standing: number
	emission_class: string
	license_plate: string
	make: string
	model: string
	owner: string
	passenger_counting: GTFSBool
	propulsion: string
	registration_date: string
	vehicle_id: string
	wheelchair_accessible: GTFSBool
}

/* * */

export function convertGTFSBoolToBoolean(gtfsBool: GTFSBool): boolean {
	return gtfsBool === GTFSBool.YES ? true : false;
}
