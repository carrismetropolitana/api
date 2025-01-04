/* * */

import { z } from 'zod';

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

export const FacilitySchema = z.object({
	district_id: z.string(),
	district_name: z.string(),
	id: z.string(),
	lat: z.number(),
	locality: z.string(),
	lon: z.number(),
	municipality_id: z.string(),
	municipality_name: z.string(),
	name: z.string(),
	parish_id: z.string(),
	parish_name: z.string(),
	region_id: z.string(),
	region_name: z.string(),
	stop_ids: z.array(z.string()),
}).strict();

export type Facility = z.infer<typeof FacilitySchema>;

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

export const SchoolSchema = FacilitySchema.extend({
	address: z.string(),
	cicles: z.string(),
	email: z.string(),
	grouping: z.string(),
	nature: z.string(),
	phone: z.string(),
	postal_code: z.string(),
	url: z.string(),
}).strict();

export type School = z.infer<typeof SchoolSchema>;

/* * */

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
