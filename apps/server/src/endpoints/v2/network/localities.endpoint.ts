/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';


/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.get('v2:network:localities:all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.get(`v2:network:localities:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.server.get('/localities', all);
FASTIFY.server.get('/localities/:id', single);

FASTIFY.server.get('/v1/localities', all);
FASTIFY.server.get('/v1/localities/:id', single);

FASTIFY.server.get('/v2/localities', all);
FASTIFY.server.get('/v2/localities/:id', single);
