/* * */

import { z } from 'zod';

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

export const StoreSchema = z.object({

	//
	// Metadata

	brand_name: z.string(),
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
	short_name: z.string(),
	stop_ids: z.array(z.string()),

	//
	// Contacts

	contacts: z
		.object({
			address: z.string(),
			email: z.string(),
			google_place_id: z.string(),
			phone: z.string(),
			postal_code: z.string(),
			url: z.string(),
		})
		.strict(),

	//
	// Opening hours

	hours: z
		.object({
			friday: z.array(z.string()),
			monday: z.array(z.string()),
			saturday: z.array(z.string()),
			special: z.string(),
			sunday: z.array(z.string()),
			thursday: z.array(z.string()),
			tuesday: z.array(z.string()),
			wednesday: z.array(z.string()),
		})
		.strict(),

	//
	// Realtime data

	realtime: z
		.object({
			active_counters: z.number(),
			current_ratio: z.number(),
			current_status: z.enum(['busy', 'closed', 'open']),
			currently_waiting: z.number(),
			expected_wait_time: z.number(),
			is_open: z.boolean(),
		})
		.strict()
		.nullable(),

}).strict();

export type Store = z.infer<typeof StoreSchema>;
