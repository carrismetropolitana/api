/* * */

import { Facility, FacilitySource } from '@/api/facilities.js';

/* * */

export interface StoresSource extends FacilitySource {
	address: string
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
	phone: string
	postal_code: string
	url: string
}

/* * */

export interface StoreMetadata extends Facility {
	address: string
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
	phone: string
	postal_code: string
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
