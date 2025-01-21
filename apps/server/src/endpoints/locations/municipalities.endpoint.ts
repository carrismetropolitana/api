/* * */

import type { FastifyReply, FastifyRequest } from 'fastify';

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { ApiResponse, ApiResponseErrorSchema, ApiResponseSuccessSchema } from '@carrismetropolitana/api-types/common';
import { Municipality, MunicipalitySchema } from '@carrismetropolitana/api-types/locations';
import fastify from 'fastify';
import { createSchema } from 'zod-openapi';

/* * */

const schema: fastify.RouteShorthandOptions['schema'] = {
	description: 'Get all Municipalities',
	response: {
		200: {
			content: {
				'application/json': {
					schema: createSchema(ApiResponseSuccessSchema(MunicipalitySchema.array())).schema,
				},
			},
			description: '200 OK',
		},
		500: {
			content: {
				'application/json': {
					schema: createSchema(ApiResponseErrorSchema).schema,
				},
			},
			description: '500 Internal Server Error',
		},
	},
	summary: 'Get all Municipalities',
	tags: ['locations'],
};

/* * */

const handler = async (_: FastifyRequest, reply: FastifyReply) => {
	//

	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.LOCATIONS.MUNICIPALITIES);

	const response: ApiResponse<Municipality[]> = {
		data: JSON.parse(allItemsTxt) || [],
		status: 'success',
		timestamp: Date.now(),
	};

	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(JSON.stringify(response));
};

/* * */

FASTIFY.GET('/locations/municipalities', handler, { schema });
