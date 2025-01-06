/* * */

import 'zod-openapi/extend';
import { z } from 'zod';
import { createSchema } from 'zod-openapi';

/* * */

export const RegionSchema = z.object({
	id: z.string(),
	name: z.string(),
}).strict();

export type Region = z.infer<typeof RegionSchema>;
