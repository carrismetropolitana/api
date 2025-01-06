/* * */

import { z } from 'zod';

/* * */

export const DistrictSchema = z
	.object({
		id: z.string(),
		name: z.string(),
		region_id: z.string(),
	})
	.strict()
	.openapi({
		description: 'This was updated! 22:28',
		example: {
			id: '1',
			name: 'District 1',
			region_id: '1',
		},
		title: 'District',
	});

export type District = z.infer<typeof DistrictSchema>;
