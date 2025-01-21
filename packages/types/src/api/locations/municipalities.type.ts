/* * */

import { z } from 'zod';

/* * */

export const MunicipalitySchema = z
	.object({
		district_id: z.string(),
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
			district_id: '01',
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
			id: '0101',
			name: 'Municipality 0101',
		},
		title: 'Municipality',
	});

export type Municipality = z.infer<typeof MunicipalitySchema>;
