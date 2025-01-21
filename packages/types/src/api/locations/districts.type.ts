/* * */

import { z } from 'zod';

/* * */

export const DistrictSchema = z
	.object({
		geometry: z.object({
			coordinates: z.array(z.array(z.array(z.number()))),
			type: z.string(),
		}),
		id: z.string(),
		name: z.string(),
	})
	.strict()
	.openapi({
		description: 'This was updated! 22:28',
		example: {
			geometry: {
				coordinates: [
					[
						[100.0, 0.0],
						[101.0, 0.0],
						[101.0, 1.0],
						[100.0, 1.0],
						[100.0, 0.0],
					],
				],
				type: 'Polygon',
			},
			id: '01',
			name: 'District 01',
		},
		title: 'District',
	});

export type District = z.infer<typeof DistrictSchema>;
