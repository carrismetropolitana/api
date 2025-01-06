/* * */

import { z } from 'zod';

/* * */

export interface CachedResource<T> {
	data: T
	timestamp_resource: number
}

/* * */

const ApiResponseBaseSchema = z.object({
	status: z.union([z.literal('success'), z.literal('error')]),
	timestamp: z.number(),
}).strict();

const ApiResponseSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) => ApiResponseBaseSchema.extend({
	data: dataSchema,
	status: z.literal('success'),
});

const ApiResponseErrorSchema = ApiResponseBaseSchema.extend({
	message: z.string(),
	status: z.literal('error'),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.union([
	ApiResponseSuccessSchema(dataSchema),
	ApiResponseErrorSchema,
]);

export type ApiResponse<T extends z.ZodTypeAny> = z.infer<ReturnType<typeof ApiResponseSchema<T>>>;
