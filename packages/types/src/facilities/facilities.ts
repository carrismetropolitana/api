/* * */

import type { Location } from '@/api/locations.js';

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
	lat: string
	location: Location
	lon: string
	name: string
	stop_ids: string[]
}

/* * */
