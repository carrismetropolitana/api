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
