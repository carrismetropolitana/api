/* * */

export interface FacilitySource {
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

export interface Facility {
	district_id: string
	district_name: string
	id: string
	lat: number
	locality: string
	lon: number
	municipality_id: string
	municipality_name: string
	name: string
	parish_id: string
	parish_name: string
	region_id: string
	region_name: string
	stop_ids: string[]
}

/* * */

export interface SchoolsSource extends FacilitySource {
	address: string
	cicles: string
	email: string
	grouping: string
	nature: string
	phone: string
	postal_code: string
	url: string
}

export interface School extends Facility {
	address: string
	cicles: string
	email: string
	grouping: string
	nature: string
	phone: string
	url: string
}

export interface StoresSource extends FacilitySource {
	address: string
	brand_name: string
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
	short_name: string
	url: string
}

/* * */

export interface StoreMetadata extends Facility {
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
	phone: string
	postal_code: string
	short_name: string
	url: string
}

export interface StoreRealtime {
	active_counters: number
	current_ratio: number
	current_status: CurrentStoreStatus
	currently_waiting: number
	expected_wait_time: number
	is_open: boolean
}

export enum CurrentStoreStatus {
	busy = 'busy',
	closed = 'closed',
	open = 'open',
}

export type Store = StoreMetadata & StoreRealtime;
