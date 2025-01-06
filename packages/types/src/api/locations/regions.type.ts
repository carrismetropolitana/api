/* * */

import { z } from 'zod';

/* * */

export const RegionSchema = z.object({
	id: z.string(),
	name: z.string(),
}).strict();

export type Region = z.infer<typeof RegionSchema>;
