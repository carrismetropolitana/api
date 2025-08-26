/* * */

import { z } from 'zod';

/* * */

export const LocalitySchema = z
	.object({
		display: z.string(),
		district_id: z.string(),
		id: z.string(),
		municipality_id: z.string(),
		name: z.string(),
		parish_id: z.string(),
	})
	.strict();
	// .openapi({
	// 	description: 'This was updated! 22:28',
	// 	example: {
	// 		display: 'Locality 01, Municipality 0101',
	// 		district_id: '01',
	// 		id: '010101-1234',
	// 		municipality_id: '0101',
	// 		name: 'Locality 1234',
	// 		parish_id: '010101',
	// 	},
	// 	title: 'Locality',
	// });

export type Locality = z.infer<typeof LocalitySchema>;
