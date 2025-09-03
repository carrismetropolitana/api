/* * */

import { z } from 'zod';

/* * */

export interface SchoolsSource {
	address: string
	artistic: string
	basic_1: string
	basic_2: string
	basic_3: string
	district_id: string
	district_name: string
	email: string
	grouping: string
	high_school: string
	id: string
	is_active: string
	lat: string
	locality: string
	lon: string
	municipality_id: string
	municipality_name: string
	name: string
	nature: string
	other: string
	parish_id: string
	parish_name: string
	phone: string
	postal_code: string
	pre_school: string
	professional: string
	region_id: string
	region_name: string
	special: string
	stops: string
	university: string
	url: string
	validation_date: string
}

export const SchoolSchema = z.object({

	//
	// Metadata

	cicles: z.array(z.string()),
	district_id: z.string(),
	district_name: z.string(),
	grouping: z.string(),
	id: z.string(),
	lat: z.number(),
	locality: z.string(),
	lon: z.number(),
	municipality_id: z.string(),
	municipality_name: z.string(),
	name: z.string(),
	nature: z.string(),
	parish_id: z.string(),
	parish_name: z.string(),
	region_id: z.string(),
	region_name: z.string(),
	stop_ids: z.array(z.string()),

	//
	// Contacts

	contacts: z
		.object({
			address: z.string(),
			email: z.string(),
			google_place_id: z.string().nullable(),
			phone: z.string(),
			postal_code: z.string(),
			url: z.string(),
		})
		.strict(),

}).strict();

export type School = z.infer<typeof SchoolSchema>;
