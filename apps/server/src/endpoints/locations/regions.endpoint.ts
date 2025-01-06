/* * */

import type { FastifyReply, FastifyRequest } from 'fastify';

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { RegionSchema } from '@carrismetropolitana/api-types/locations';

/* * */

const schema = {
	description: 'Get all Regions',
	response: {
		200: RegionSchema.array(),
	},
	summary: 'Get all ENCM facilities',
	tags: ['locations'],
};

/* * */

const handler = async (_: FastifyRequest, reply: FastifyReply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.LOCATIONS.REGIONS);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(allItemsTxt);
};

/* * */

FASTIFY.GET('/locations/regions', handler, { schema });
