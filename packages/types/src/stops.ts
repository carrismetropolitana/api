/* * */

import { WheelchairBoardingType } from 'gtfs-types';

/* * */

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

/* * */

export interface Region {
	region_id: string
	region_name: string
}

export interface District extends Region {
	district_id: string
	district_name: string
}

export interface Municipality extends District {
	municipality_id: string
	municipality_name: string
	municipality_prefix: string
}

export interface Locality extends Municipality {
	display: string
	locality_id: string
	locality_name: string
}
