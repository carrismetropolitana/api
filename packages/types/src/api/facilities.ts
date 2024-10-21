/* * */

import type { Address, Contact, Location, Position } from '@/api/locations.js';

/* * */

export interface BoatStationsSource {
	district_id: string
	district_name: string
	id: string
	lat: string
	locality: string
	lon: string
	municipality_id: string
	municipality_name: string
	name: string
	parish_id: string
	parish_name: string
	region_id: string
	region_name: string
	stops: string
}

export interface BoatStation {
	boat_station_id: string
	location: Location
	name: string
	position: Position
	stop_ids: string[]
}

/* * */

export interface LightRailStationsSource {
	district_id: string
	district_name: string
	id: string
	lat: string
	locality: string
	lon: string
	municipality_id: string
	municipality_name: string
	name: string
	parish_id: string
	parish_name: string
	region_id: string
	region_name: string
	stops: string
}

export interface LightRailStation {
	light_rail_station_id: string
	location: Location
	name: string
	position: Position
	stop_ids: string[]
}

/* * */

export interface SubwayStationsSource {
	district_id: string
	district_name: string
	id: string
	lat: string
	locality: string
	lon: string
	municipality_id: string
	municipality_name: string
	name: string
	parish_id: string
	parish_name: string
	region_id: string
	region_name: string
	stops: string
}

export interface SubwayStation {
	location: Location
	name: string
	position: Position
	stop_ids: string[]
	subway_station_id: string
}

/* * */

export interface TrainStationsSource {
	district_id: string
	district_name: string
	id: string
	lat: string
	locality: string
	lon: string
	municipality_id: string
	municipality_name: string
	name: string
	parish_id: string
	parish_name: string
	region_id: string
	region_name: string
	stops: string
}

export interface TrainStation {
	location: Location
	name: string
	position: Position
	stop_ids: string[]
	train_station_id: string
}

/* * */

export interface PipsSource {
	district_id: string
	district_name: string
	id: string
	lat: string
	locality: string
	lon: string
	municipality_id: string
	municipality_name: string
	name: string
	parish_id: string
	parish_name: string
	region_id: string
	region_name: string
	stops: string
}

export interface Pip {
	location: Location
	name: string
	pip_id: string
	position: Position
	stop_ids: string[]
}

/* * */

export interface SchoolsSource {
	address: string
	district_id: string
	district_name: string
	email: string
	grouping: string
	id: string
	lat: string
	locality: string
	lon: string
	municipality_id: string
	municipality_name: string
	name: string
	nature: string
	parish_id: string
	parish_name: string
	phone: string
	postal_code: string
	region_id: string
	region_name: string
	stops: string
	url: string
}

export interface School {
	address: Address
	cicles: string
	contact: Contact
	grouping: string
	location: Location
	name: string
	nature: string
	position: Position
	school_id: string
	stop_ids: string[]
}
