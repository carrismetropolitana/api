/* * */

import { z } from 'zod';

/* * */

export const DistrictSchema = z
	.object({
		id: z.string(),
		name: z.string(),
	})
	.strict();
	// .openapi({
	// 	description: 'This was updated! 22:28',
	// 	example: {
	// 		id: '01',
	// 		name: 'District 01',
	// 	},
	// 	title: 'District',
	// });

export type District = z.infer<typeof DistrictSchema>;
