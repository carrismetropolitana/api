/* * */

import { z } from 'zod';

/* * */

export const RegionSchema = z.object({
	id: z.string(),
	name: z.string(),
}).strict();

export type Region = z.infer<typeof RegionSchema>;

/* * */

export const DistrictSchema = z.object({
	id: z.string(),
	name: z.string(),
	region_id: z.string(),
}).strict();

export type District = z.infer<typeof DistrictSchema>;

/* * */

export const MunicipalitySchema = z.object({
	district_id: z.string(),
	id: z.string(),
	name: z.string(),
	region_id: z.string(),
}).strict();

export type Municipality = z.infer<typeof MunicipalitySchema>;

/* * */

export const ParishSchema = z.object({
	district_id: z.string(),
	id: z.string(),
	municipality_id: z.string(),
	name: z.string(),
	region_id: z.string(),
}).strict();

export type Parish = z.infer<typeof ParishSchema>;

/* * */

export const LocalitySchema = z.object({
	display: z.string(),
	district_id: z.string(),
	id: z.string(),
	municipality_id: z.string(),
	name: z.string(),
	parish_id: z.string().optional(),
	region_id: z.string(),
}).strict();

export type Locality = z.infer<typeof LocalitySchema>;
