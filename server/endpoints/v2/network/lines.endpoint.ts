/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2/network/lines/all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`v2/network/lines/${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

FASTIFY.server.get('/v2/lines', all);
FASTIFY.server.get('/v2/lines/:id', single);
