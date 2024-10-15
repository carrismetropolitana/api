/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';


/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:datasets:facilities:encm:all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`v2:datasets:facilities:encm:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.server.get('/datasets/facilities/encm', all);
FASTIFY.server.get('/datasets/facilities/encm/:id', single);

FASTIFY.server.get('/v1/datasets/facilities/encm', all);
FASTIFY.server.get('/v1/datasets/facilities/encm/:id', single);

FASTIFY.server.get('/v2/datasets/facilities/encm', all);
FASTIFY.server.get('/v2/datasets/facilities/encm/:id', single);
