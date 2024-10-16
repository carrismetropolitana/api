/* * */

import { CalendarDates, GTFSBool, Route, StopTime, Trip, WheelchairBoardingType } from 'gtfs-types';

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
export interface GtfsDate {
	date: string
	day_type: string
	description: string
	holiday: string
	period: string
}

/**
 * Type for GTFS periods.txt file.
 */
export interface GtfsPeriod {
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
export type StopTimeExtended = StopTime;

/**
 * Type for GTFS vehicles.txt file.
 */
export interface VehicleExtended {
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
