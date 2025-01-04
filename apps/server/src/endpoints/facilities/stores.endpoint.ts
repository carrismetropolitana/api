/* * */

import type { FastifyReply, FastifyRequest } from 'fastify';

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { SchoolSchema } from '@carrismetropolitana/api-types/facilities';

/* * */

const schema = {
	description: 'Get all ENCM facilities',
	response: {
		200: SchoolSchema.array(),
	},
	summary: 'Get all ENCM facilities',
	tags: ['datasets'],
};

/* * */

const handler = async (_: FastifyRequest, reply: FastifyReply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.STORES);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=30')
		.send(allItemsTxt);
};

/* * */

FASTIFY.GET('/facilities/stores', handler, { schema });
