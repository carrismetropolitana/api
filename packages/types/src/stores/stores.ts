/* * */

import type { Location } from '@/api/locations.js';

/* * */

export interface StoresSource {
	address: string
	brand_name: string
	district_id: string
	district_name: string
	email: string
	google_place_id: string
	hours_friday: string
	hours_monday: string
	hours_saturday: string
	hours_special: string
	hours_sunday: string
	hours_thursday: string
	hours_tuesday: string
	hours_wednesday: string
	id: string
	lat: string
	locality: string
	lon: string
	municipality_id: string
	municipality_name: string
	name: string
	parish_id: string
	parish_name: string
	phone: string
	postal_code: string
	region_id: string
	region_name: string
	short_name: string
	stops: string
	url: string
}

/* * */

export interface StoreMetadata {
	address: string
	brand_name: string
	email: string
	google_place_id: string
	hours_friday: string[]
	hours_monday: string[]
	hours_saturday: string[]
	hours_special: string
	hours_sunday: string[]
	hours_thursday: string[]
	hours_tuesday: string[]
	hours_wednesday: string[]
	lat: number
	location: Location
	lon: number
	name: string
	phone: string
	postal_code: string
	short_name: string
	stop_ids: string[]
	store_id: string
	url: string
}

export interface StoreRealtime {
	active_counters: number
	current_ratio: number
	current_status: CurrentStatus
	currently_waiting: number
	estimated_wait_seconds: number
	is_open: boolean
}

export enum CurrentStatus {
	busy = 'busy',
	closed = 'closed',
	open = 'open',
}

export type Store = StoreMetadata & StoreRealtime;
