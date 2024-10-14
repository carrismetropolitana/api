/* * */

import FASTIFY from '@/services/FASTIFY.js';
import { SERVERDB } from '@api/services';


/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.client.get('routes:all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`routes:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.server.get('/routes', all);
FASTIFY.server.get('/routes/:id', single);

FASTIFY.server.get('/v1/routes', all);
FASTIFY.server.get('/v1/routes/:id', single);
