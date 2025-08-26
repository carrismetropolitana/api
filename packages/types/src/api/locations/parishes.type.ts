/* * */

import { z } from 'zod';

/* * */

export const ParishSchema = z
	.object({
		district_id: z.string(),
		id: z.string(),
		municipality_id: z.string(),
		name: z.string(),
	})
	.strict();
	// .openapi({
	// 	description: 'This was updated! 22:28',
	// 	example: {
	// 		district_id: '01',
	// 		id: '010101',
	// 		municipality_id: '0101',
	// 		name: 'Parish 01',
	// 	},
	// 	title: 'Parish',
	// });

export type Parish = z.infer<typeof ParishSchema>;
