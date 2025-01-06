/* * */

import 'zod-openapi/extend';
import { z } from 'zod';
import { createSchema } from 'zod-openapi';

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
