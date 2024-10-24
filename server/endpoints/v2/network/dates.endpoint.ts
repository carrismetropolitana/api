/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:network:dates:all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`v2:network:dates:${request.params.date}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.server.get('/dates', all);
FASTIFY.server.get('/dates/:date', single);

FASTIFY.server.get('/v1/dates', all);
FASTIFY.server.get('/v1/dates/:date', single);

FASTIFY.server.get('/v2/dates', all);
FASTIFY.server.get('/v2/dates/:date', single);
