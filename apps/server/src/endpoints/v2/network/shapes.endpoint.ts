/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';


/* * */

const single = async (request, reply) => {
	const singleItem = await SERVERDB.get(`v2:network:shapes:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.server.get('/shapes/:id', single);

FASTIFY.server.get('/v1/shapes/:id', single);

FASTIFY.server.get('/v2/shapes/:id', single);
