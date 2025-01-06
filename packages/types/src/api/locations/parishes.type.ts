/* * */

import { z } from 'zod';

/* * */

export const ParishSchema = z.object({
	district_id: z.string(),
	id: z.string(),
	municipality_id: z.string(),
	name: z.string(),
	region_id: z.string(),
}).strict();

export type Parish = z.infer<typeof ParishSchema>;
