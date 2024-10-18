/* * */

import type { WheelchairBoardingType } from 'gtfs-types';

import type { Locality } from './api/locations.js';

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
