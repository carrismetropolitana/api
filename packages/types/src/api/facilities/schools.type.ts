/* * */

import { z } from 'zod';

/* * */

export interface SchoolsSource {
	address: string
	cicles: string
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

export const SchoolSchema = z.object({

	//
	// Metadata

	cicles: z.string(),
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
