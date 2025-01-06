/* * */

import { z } from 'zod';

/* * */

export interface CachedResource<T> {
	data: T
	timestamp_resource: number
}

/* * */

export const ApiResponseErrorSchema = z.object({
	message: z.string(),
	status: z.literal('error'),
	timestamp: z.number(),
});

export type ApiResponseError = z.infer<typeof ApiResponseErrorSchema>;
