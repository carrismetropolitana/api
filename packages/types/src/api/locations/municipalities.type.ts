/* * */

import { z } from 'zod';

/* * */

export const MunicipalitySchema = z
	.object({
		district_id: z.string(),
		id: z.string(),
		name: z.string(),
	})
	.strict();
	// .openapi({
	// 	description: 'This was updated! 22:28',
	// 	example: {
	// 		district_id: '01',
	// 		id: '0101',
	// 		name: 'Municipality 0101',
	// 	},
	// 	title: 'Municipality',
	// });

export type Municipality = z.infer<typeof MunicipalitySchema>;
