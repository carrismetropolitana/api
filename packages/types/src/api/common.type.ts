/* * */

import 'zod-openapi/extend';
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

/* * */

export const ApiResponseSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
	return z.object({
		data: dataSchema,
		status: z.literal('success'),
		timestamp: z.number(),
	});
};

interface ApiResponseSuccess {

	/**
	 * The data to be returned.
	 * The type of this property is intentionally string, empty array or empty object to allow for sending empty responses.
	 * The return type of the server data (from REDIS) is always a string. This avoids a useless conversion from string
	 * to object and back to string. The OpenAPI schema will define the correct type.
	 */
	data: [] | object | string

	/**
	 * The status of the response.
	 */
	status: 'success'

	/**
	 * The timestamp of when the response was generated.
	 */
	timestamp: number

}

export type ApiResponse = ApiResponseError | ApiResponseSuccess;
