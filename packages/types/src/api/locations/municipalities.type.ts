/* * */

import { z } from 'zod';

/* * */

export const MunicipalitySchema = z.object({
	district_id: z.string(),
	id: z.string(),
	name: z.string(),
	region_id: z.string(),
}).strict();

export type Municipality = z.infer<typeof MunicipalitySchema>;
