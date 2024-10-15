/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';


/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:network:municipalities:all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`v2:network:municipalities:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.server.get('/municipalities', all);
FASTIFY.server.get('/municipalities/:id', single);

FASTIFY.server.get('/v1/municipalities', all);
FASTIFY.server.get('/v1/municipalities/:id', single);

FASTIFY.server.get('/v2/municipalities', all);
FASTIFY.server.get('/v2/municipalities/:id', single);
