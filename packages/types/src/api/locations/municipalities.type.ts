/* * */

import 'zod-openapi/extend';
import { z } from 'zod';
import { createSchema } from 'zod-openapi';

/* * */

export const MunicipalitySchema = z.object({
	district_id: z.string(),
	id: z.string(),
	name: z.string(),
	region_id: z.string(),
}).strict();

export type Municipality = z.infer<typeof MunicipalitySchema>;
