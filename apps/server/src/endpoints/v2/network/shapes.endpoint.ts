/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';

/* * */

const single = async (request, reply) => {
	const singleItem = await SERVERDB.get(`${SERVERDB_KEYS.NETWORK.SHAPES}:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.server.get('/shapes/:id', single);

FASTIFY.server.get('/v1/shapes/:id', single);

FASTIFY.server.get('/v2/shapes/:id', single);
